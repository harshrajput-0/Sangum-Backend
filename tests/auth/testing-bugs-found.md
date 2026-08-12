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

## Summary

| # | Issue | Category | Root cause | Fix |
|---|---|---|---|---|
| 1 | Refresh tokens could collide | **App bug** | JWT `iat` has 1-second granularity, no per-token uniqueness | Added `jti` to refresh token payload |
| 2 | Rate limiter blocked tests | Infra | 10 req/15min limit applies to test traffic too | `skip` when `NODE_ENV === "test"` |
| 3 | Transactions failed on in-memory DB | Infra | Standalone MongoDB doesn't support transactions | `MongoMemoryReplSet` instead of `MongoMemoryServer` |
| 4 | "Catalog changes" error, first write only | Infra | Collections can't be created implicitly inside a transaction | `Model.init()` for every model touched in a transaction, in `beforeAll` |
| 5 | Two TS strictness flags in test code | Infra | Dynamic key indexing; `set-cookie` mistyped as `string` | Iterate `Object.values()`; typed `getSetCookies()` helper |

Only #1 represents a defect that shipped in application code. The rest are
exactly the kind of environment friction that's worth documenting once,
here, so the next test file added to this project doesn't have to
rediscover any of it from scratch.
