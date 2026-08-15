# Bugs found while building the integration test suite

This covers issues that only surfaced once real Supertest + Vitest tests were
written and run — as distinct from the bugs found earlier through manual
Postman/browser testing (those are documented in the fix-plan tracker).

They split into two honestly-different categories:

- **Real application bugs** — genuine defects in production code, caught
  *because* an automated test exercised a case manual testing never
  happened to hit.
- **Testing infrastructure issues** — nothing wrong with the app itself;
  friction in getting an in-memory MongoDB + Vitest environment to behave
  like the real thing.

Both are worth recording — the first because it's a real fix, the second
because the next person setting up tests here will hit the exact same
walls otherwise.

---

## 1. Real bug: refresh tokens could collide within the same second

**Category:** Application bug — security-adjacent
**Found by:** `tests/auth/refresh-token.test.ts`
**Status:** Fixed

### Symptom

Two tests failed on first run:

```
expected 'eyJhbGc...' not to be 'eyJhbGc...'   (rotation test)
expected 200 to be 401                          (reuse-rejection test)
```

The "new" access token after calling `/refresh-token` was byte-for-byte
identical to the one issued at registration. Reusing the *original*
(supposedly rotated-out) refresh cookie a second time still succeeded.

### Root cause

`generateRefreshToken`'s payload was just `{ userId }` — nothing else. JWT's
`iat` (issued-at) claim has **one-second** granularity, not millisecond. A
register call and a refresh call fired back-to-back in a test (or by a real
client retrying/double-clicking) can land in the same wall-clock second,
producing an identical payload and therefore an identical signed token
string. Since the refresh token is compared against a stored hash on the
server, an "old" token that happens to be identical to the newly-rotated one
would still pass that comparison — silently defeating rotation.

Manual testing never caught this because a human clicking through Postman
naturally has seconds of gap between actions. Only an automated test firing
requests programmatically, back-to-back, was fast enough to land two calls
in the same second reliably.

### Fix

Added a `jti` (JWT ID) — a random value per token — so no two refresh tokens
are ever identical regardless of timing:

```ts
// src/utils/generateTokens.ts
import crypto from "crypto";

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });
};
```

No caller had to change — every `generateRefreshToken({ userId })` call
site across `auth.services.ts` (register, login, refresh, both OAuth
branches) stayed exactly as-is, since the fix lives entirely inside the
function.

`generateAccessToken` was deliberately **not** given the same treatment.
Access tokens are stateless and never compared against a stored value —
two identical ones issued in the same second aren't a security problem,
just two independently-valid tokens. Only the refresh token's
store-and-compare design made the collision a real gap.

The test itself was also hardened to prove this holds regardless of `jti`,
by forcing genuine separation between calls rather than relying on the fix
alone:

```ts
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// ...
await wait(1100); // forces the two calls into different iat seconds
```

---

## 2. Infra: the rate limiter blocked the test suite itself

**Category:** Testing infrastructure
**Found by:** Any test file hitting `/login` or `/register` more than 10 times

### Symptom

Tests started failing with `429 Too many attempts` — not because anything
was broken, but because `authRateLimit` (10 requests / 15 min / IP) doesn't
distinguish a real attacker from a test suite firing dozens of requests in
seconds.

### Fix

```ts
// src/middlewares/rateLimit.middleware.ts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => env.NODE_ENV === "test",
  // ...
});
```

---

## 3. Infra: in-memory MongoDB doesn't support transactions by default

**Category:** Testing infrastructure
**Found by:** `tests/auth/register.test.ts` — "creates a new account"

### Symptom

```
AssertionError: expected 500 to be 201
```

`registerUser` wraps its writes in a MongoDB transaction
(`session.startTransaction()`). Transactions require a **replica set** —
even a single-node one. `MongoMemoryServer.create()` boots a plain
standalone instance, which rejects `startTransaction()` outright. This
never showed up in manual testing because the real development database is
already a proper replica set.

### Fix

```ts
// tests/setup.ts
import { MongoMemoryReplSet } from "mongodb-memory-server"; // not MongoMemoryServer

replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
await mongoose.connect(replset.getUri());
```

---

## 4. Infra: "catalog changes" error on the first transactional write

**Category:** Testing infrastructure
**Found by:** Same register test, intermittently — after fix #3, roughly
half of runs still failed

### Symptom

```
Unable to write to collection 'test.accounts' due to catalog changes;
please retry the operation :: Please retry your operation or
multi-document transaction.
```

Only ever the *first* real write to a given collection in a fresh
database, in whichever test file happened to run first.

### Root cause (and how the diagnosis evolved)

**First theory:** a freshly-booted single-node replica set reports itself
"running" slightly before it's actually ready to accept transactions —
a timing issue. Fix attempted: retry a harmless empty transaction in
`beforeAll` until one succeeds.

That helped, but didn't fully resolve it — the same error still surfaced
occasionally, in a different file, on a different run.

**Real root cause:** MongoDB doesn't allow a collection to be created
*implicitly* as a side effect of a transaction — creating one is itself a
"catalog change," and catalog changes aren't allowed mid-transaction. The
very first write to a not-yet-existing collection throws this exact,
specifically-worded error. It's a one-time cost per collection, not a
timing race — which is why an empty warm-up transaction (touching no real
collection) never fixed it.

### Fix

Explicitly create — and fully initialize, including indexes — every
collection touched inside a transaction, before any test runs:

```ts
// tests/setup.ts
import Account from "../src/modules/auth/account.model.js";
import User from "../src/modules/users/user.model.js";
import UserStats from "../src/modules/users/userStat.model.js";

await Account.init();
await User.init();
await UserStats.init();
```

`.init()` rather than `.createCollection()` specifically — Mongoose builds
indexes asynchronously in the background after a model connects, so
`createCollection()` alone can still leave a window where the collection
exists but an index is mid-build exactly when the first transaction fires,
triggering the same error from a slightly different angle. `.init()` waits
for both.

The earlier retry-loop was removed once this was in place — it was
solving a symptom of the wrong theory, not the actual cause.

---

## 5. Minor: TypeScript strictness surfaced two real gaps in the test code itself

**Category:** Testing infrastructure (test-code correctness, not app bugs)

**a) `noUncheckedIndexedAccess` on a `for...in` loop** in the `afterEach`
cleanup (`tests/setup.ts`), indexing `mongoose.connection.collections` by a
dynamic key. Fixed by iterating `Object.values(...)` directly instead of
indexing by key — same cleanup, no dynamic access for the flag to catch.

**b) `set-cookie` response headers are typed as a plain `string`** by
`@types/superagent`, but Supertest actually returns a real `string[]` at
runtime whenever a redirect sets a cookie. This went unnoticed in earlier
tests (indexing a string with `[0]` is still valid TypeScript, just
semantically wrong) until a test called `.some(...)` — an array-only
method — which the type system correctly flagged as invalid on a `string`.
Fixed with one shared helper per OAuth test file:

```ts
function getSetCookies(res: request.Response): string[] {
  return (res.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
}
```

---

## 6. Infra: `tests/setup.ts` was missing env vars the app had since moved to

**Category:** Testing infrastructure
**Found by:** Every test file, simultaneously — first noticed while
building `tests/users/onboarding.test.ts`

### Symptom

Every single test file failed at import time with `process.exit(1)`,
before a single test ran — including files that had nothing to do with
onboarding.

### Root cause

`env.ts`'s Zod schema requires `RESEND_API_KEY`, `EMAIL_FROM`, and
`CONTACT_RECIPIENT_EMAIL` — added when email delivery moved from
Gmail/nodemailer to Resend. `tests/setup.ts` still only set the old
`EMAIL_USER`/`EMAIL_PASS` pair from before that migration, and was never
updated alongside it. Not caused by the onboarding work — just never
surfaced before because nobody had run the full suite since the email
provider switched.

### Fix

```ts
// tests/setup.ts
process.env.RESEND_API_KEY = "test_resend_key";
process.env.EMAIL_FROM = "test@example.com";
process.env.CONTACT_RECIPIENT_EMAIL = "contact@example.com";
```

---

## 7. Test bug: a discarded intermediate response turned one failure into a different one

**Category:** Test-code correctness, not an app bug
**Found by:** `tests/auth/me.test.ts` — "reflects isProfileComplete: true
right after onboarding completes"

### Symptom

`GET /auth/me` came back `200` with `isProfileComplete: false`, right
after an onboarding POST that was assumed to have succeeded. Read at face
value, this looked like a `/auth/me` bug — reading stale state.

### Root cause

The test never checked the onboarding POST's own response:

```ts
// before
await request(app).post("/api/v1/users/onboarding").set("Authorization", ...);
const res = await request(app).get("/api/v1/auth/me").set("Authorization", ...);
expect(res.body.data.isProfileComplete).toBe(true); // fails here
```

The onboarding call was actually returning `404` (see #8 below) — a
completely different, upstream failure. `/auth/me` was working correctly
the whole time; it was accurately reporting that onboarding had never run.

### Fix

Assert on every intermediate response in a multi-request test chain, not
just the final one:

```ts
const onboardingRes = await request(app).post("/api/v1/users/onboarding").set(...);
expect(
  onboardingRes.status,
  `onboarding POST failed: ${JSON.stringify(onboardingRes.body)}`,
).toBe(200);
```

The custom failure message matters as much as the assertion itself — it's
the difference between "here's exactly what broke" and a multi-step
debugging session to work backwards from a symptom two requests removed
from the cause. General rule going forward for this suite: any test that
chains requests where a later assertion depends on an earlier one
succeeding needs to assert on the earlier one too.

---

## 8. Infra: route-mount typo only visible once files were actually diffed

**Category:** Process/workflow, surfaced as a routing bug
**Found by:** The hardened test from #7, once it revealed the real status code

### Symptom

```
AssertionError: onboarding POST failed: {}: expected 404 to be 200
```

Every onboarding test failed with a plain `404` — not a validation error,
not an auth error, an actual "no route matched."

### Root cause

`src/app.ts` had:

```ts
app.use(`${API_PREFIX}/user`, userRoutes);   // singular — wrong
```

instead of

```ts
app.use(`${API_PREFIX}/users`, userRoutes);  // plural — matches every test/frontend call
```

Deeper cause: the onboarding module's files were shared as a downloadable
zip rather than pasted inline. Reviewing "the file" for this bug kept
coming back clean, because the file being reviewed and the file actually
running weren't reliably the same one — a change described-and-zipped
early in a long working session had silently failed to land in the real
checkout. The exact same root cause produced bug #33 in
`auth-module-bug-history.md` (missing OAuth avatar seed line) later in
the same session, which is what finally made the pattern obvious. Fixed
going forward by pasting every actual code change inline for direct
copy-paste instead.

### Fix

One-character mount fix, plus a general process change (inline over zip)
that mattered more than the fix itself.

---

## 9. Test bugs: a stale assertion and a leaking mock, both in `onboarding.test.ts`

**Category:** Test-code correctness, not app bugs
**Found by:** `tests/users/onboarding.test.ts`, same full-suite run as #6–8

### 9a. Stale regex after a source change

"auto-generates username and displayName when both are omitted" asserted
`/^[a-z0-9_]{5,20}$/` and `.startsWith("autogen")`. Both predated the
username-charset change that started allowing `.` and `-`. Once dots
started surviving generation instead of being stripped,
`auto.gen@example.com` correctly generated `auto.gen7831` — which the old
assertions rejected as if it were a bug. Fixed by updating both to match
the current charset and expect the dot. The lesson isn't really about this
one test: a source-level validation change needs every test asserting on
that exact shape swept for staleness, not just the tests written
specifically to cover the change.

### 9b. Mock call-history not cleared between tests

"rejects a non-image file upload with 400" asserted
`expect(mockedUpload).not.toHaveBeenCalled()` — and failed, even though
the `400` rejection itself worked correctly. `mockedUpload`'s call history
is cumulative across every test in the file unless explicitly cleared; the
call recorded by the *previous* test ("uploads the avatar to Cloudinary
when a file is provided", which legitimately calls `upload()` once) was
still sitting in the mock's history when this test's assertion ran.

```ts
// fix — clear all mocks' call history before each test
beforeEach(() => {
  mockedUpload.mockClear();
  mockedAxios.get.mockClear();
  mockedAxios.post.mockClear();
});
```

`mockClear()` specifically, not `mockReset()` — it clears recorded calls
without touching queued `mockResolvedValueOnce(...)` implementations that
other tests still depend on.

---

## Summary

| # | Issue | Category | Root cause | Fix |
|---|---|---|---|---|
| 1 | Refresh tokens could collide | **App bug** | JWT `iat` has 1-second granularity, no per-token uniqueness | Added `jti` to refresh token payload |
| 2 | Rate limiter blocked tests | Infra | 10 req/15min limit applies to test traffic too | `skip` when `NODE_ENV === "test"` |
| 3 | Transactions failed on in-memory DB | Infra | Standalone MongoDB doesn't support transactions | `MongoMemoryReplSet` instead of `MongoMemoryServer` |
| 4 | "Catalog changes" error, first write only | Infra | Collections can't be created implicitly inside a transaction | `Model.init()` for every model touched in a transaction, in `beforeAll` |
| 5 | Two TS strictness flags in test code | Infra | Dynamic key indexing; `set-cookie` mistyped as `string` | Iterate `Object.values()`; typed `getSetCookies()` helper |
| 6 | Every test file died at import, `RESEND_API_KEY` etc. missing | Infra | `tests/setup.ts` never updated when email moved to Resend | Added the missing env vars |
| 7 | Onboarding POST's status silently discarded in a chained test | Test-code | Assumed success instead of asserting it | Assert on every intermediate response, not just the final one |
| 8 | `/auth/me` test 404'd on a route that "should" exist | Process | Onboarding files shared via zip, one change never landed in the real checkout | Paste code inline going forward instead of zipping |
| 9 | Stale regex + leaking mock, both in `onboarding.test.ts` | Test-code | Assertion not updated after a source change; mock history not cleared between tests | Updated regex/prefix; added `beforeEach` mock clearing |

Only #1 represents a defect that shipped in application code. Most of the
rest are environment friction; #7 and #8 are about how the debugging
itself went, kept here because the methodology — assert on intermediate
steps, diff the actual file rather than trust a description of it — is
the reusable part, worth remembering next time something "should" work
and doesn't.