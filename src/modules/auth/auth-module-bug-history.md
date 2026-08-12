# Auth module — complete bug history

Every bug found and fixed across the whole auth module, from the initial
static-code audit through manual Postman testing through the automated
Supertest suite. Organized to match the same 10-phase structure as the
interactive fix-plan tracker, so the two can be cross-referenced directly.

**38 issues total** — routing bugs that made endpoints unreachable, logic
bugs that crashed working requests, data-layer typos that silently broke
features, missing wiring, and a handful of things only automated testing
was fast/thorough enough to catch.

---

## Summary

| # | Issue | Found by | Severity |
|---|---|---|---|
| 1 | Register/login routes missing leading `/` → 404 | Static audit, confirmed live | Blocking |
| 2 | Logout route reused register's path | Static audit | Blocking |
| 3 | No route for `refreshToken` controller at all | Static audit, confirmed live | Blocking |
| 4 | `authenticate` middleware's `"Bearer "` had a trailing space | Static audit, confirmed live | Blocking |
| 5 | No global error-handling middleware | Static audit, confirmed live | Blocking |
| 6 | `account.hasEmail()` didn't exist | Static audit, confirmed live | High |
| 7 | `account.comparePassword()` didn't exist | Static audit | High |
| 8 | `account.needEmail()` didn't exist | Static audit | High |
| 9 | `registerUser`'s duplicate-email check was inverted | Static audit, confirmed live | High |
| 10 | `completeEmail`'s existence check was inverted | Static audit; still present, refixed in Phase 9 | High |
| 11 | Refresh-token controller set the cookie from the wrong variable | Static audit | High |
| 12 | GitHub OAuth: stub profile fetch, wrong token-exchange field, no `User-Agent` | Static audit + manual build | High |
| 13 | `addOAuthProvider` used `findById`'s 2nd arg as a projection, not an update | Static audit, confirmed live | Medium |
| 14 | `emailVerificaiontToken` typo — verification tokens never persisted | Static audit, confirmed live | Medium |
| 15 | `findById` passed an object instead of an id (dead code) | Static audit | Medium |
| 16 | `updatePassword` didn't await/return the save | Static audit, fixed in Phase 10 | Medium |
| 17 | `userStats` index typo (`followersCount` vs `followerCount`) | Static audit | Medium |
| 18 | Badge `awardedAt` default evaluated once at boot, not per-document | Static audit | Medium |
| 19 | Rate limiting / role guard / optional-auth middleware built but never mounted | Static audit, mounted in Phase 10 | Medium |
| 20 | `registerUser` aborted a transaction that had already committed | Manual live testing | Blocking |
| 21 | `registerUser` never actually returned `refreshToken` (`as any` masked it) | Manual live testing | High |
| 22 | `findByUserId` didn't re-select `refreshToken` (`select: false`) | Manual live testing | High |
| 23 | Refresh cookie had no explicit `path`, defaulting to a too-narrow scope | Manual live testing | High |
| 24 | `resendVerificationEmail` never actually sent an email (`queueEmail` was phantom) | Manual live testing | High |
| 25 | Status codes swapped in `resendVerificationEmail` (400 vs 404) | Manual live testing | Low |
| 26 | `EMAIL_USER`/`EMAIL_PASS` bypassed the validated env schema | Manual live testing | Low |
| 27 | Mongoose `{ new: true }` deprecation warning | Manual live testing | Low |
| 28 | Refresh tokens could collide within the same wall-clock second | **Supertest suite** | **High — security-adjacent** |
| 29 | Rate limiter blocked the test suite itself | Supertest suite (infra) | — |
| 30 | In-memory MongoDB doesn't support transactions by default | Supertest suite (infra) | — |
| 31 | "Catalog changes" error on the first transactional write | Supertest suite (infra) | — |
| 32 | `noUncheckedIndexedAccess` + `set-cookie` mistyping in test code | Supertest suite (infra) | — |

Rows 29–32 are testing-infrastructure issues, not application defects —
included for completeness; full write-up in `testing-bugs-found.md`.

---

## Phase 1–3: Routing, middleware, and error handling

These five made the auth module **entirely unreachable or unusable**
regardless of what a request contained — found first, fixed first, since
nothing else could be tested until they were.

**1. Missing leading slash.** `router.post("register", ...)` and
`router.post("login", ...)` never matched `/auth/register` or
`/auth/login` — Express requires the leading `/`. Confirmed by actually
running the server and hitting both routes: `404` on both.

**2. Logout's route was a copy-paste of register's.**
`router.post("register", authenticate, authController.logout)` — wrong
path, wrong verb pairing, and shadowed by the real register route above it
even once the slash was fixed.

**3. `refreshToken` had no route.** The controller function existed and
was exported; nothing in `auth.routes.ts` ever pointed at it.

**4. The Bearer check compared against the wrong string.**
`schema !== "Bearer "` (trailing space) can never equal `"Bearer"` — the
actual result of `authHeader.split(" ")`. Every valid token was rejected.
Reproduced directly: `"Bearer" !== "Bearer "` → `true`.

**5. No centralized error handler.** Thrown `ApiError`s fell through to
Express's default handler, returning an HTML stack-trace page instead of
the app's `{success, statusCode, message, errors}` JSON shape. Confirmed
by hitting an intentionally-invalid OAuth provider and getting back
`Content-Type: text/html`.

---

## Phase 4–6: Login, logout, refresh token

**6–8. Three method-name mismatches**, all the same shape: the interface
declared one method name, the schema implemented a different one.

- `hasEmail()` called, only `needsEmail()` existed → crashed *every*
  successful register/login/refresh response, since `toAuthUserResponse`
  runs on all of them.
- `comparePassword()` called, only `isPasswordCorrect()` existed → login
  always threw.
- `needEmail()` called (missing the `s`), schema had `needsEmail()` →
  `completeEmail` always threw.

**9. Inverted duplicate-email check.** `if (!existing) throw conflict(...)`
threw "already exists" when the account did *not* exist — blocking every
real signup while letting genuine duplicates fall through to a raw Mongo
`E11000` crash. Fixed by flipping the condition.

**11. Wrong variable in the refresh-token cookie call.**
`setRefreshCookie(res, token.refreshToken)` — `token` was the raw cookie
*string*, not the service result. Fixed to read `result.refreshToken`.

**20. Transaction abort-after-commit.** `registerUser`'s `catch` block
unconditionally called `session.abortTransaction()`, even when the error
happened *after* a successful commit — throwing a second, unrelated
`MongoTransactionError` that masked whatever the real error actually was.
Fixed by guarding with `session.inTransaction()`.

**21. `registerUser` never actually returned `refreshToken`.** The return
statement used `as AuthResponse & { refreshToken: string } as any` — a
type-level lie. The object literal itself only had `user` and
`accessToken`; the cast just told TypeScript to stop checking. Every
register call silently set the refresh cookie to `undefined`.

**22. `refreshToken` field never re-selected.** `refreshToken` is
`select: false` on the schema; `findByUserId` queried without
`.select("+refreshToken")`, so `account.refreshToken` was always
`undefined` regardless of what was actually saved — `refreshAccessToken`
failed every time with `"Session not found"`, even immediately after a
successful login.

**23. Refresh cookie had no explicit path.** Without one, a cookie
defaults to the *directory* of whatever URL set it — a cookie issued by
`/oauth/google/callback` was scoped narrowly enough that it never reached
the sibling path `/refresh-token`. Fixed with an explicit `path: "/"`.

---

## Phase 7–8: OAuth (Google, GitHub, and later LinkedIn)

**12. GitHub OAuth was an incomplete stub** on three fronts at once:
`fetchGithubProfile` was entirely commented out; the token-exchange call
used a field named `client_redirect`, which GitHub's API doesn't
recognize (should be `redirect_uri`); and `"github"` was never added to
the controller's `providerMap`, so `/oauth/github` returned `400
Unsupported OAuth Provider`. All three fixed together when the provider
was actually built out, including the `/user/emails` fallback for
accounts with no public email.

**13. `addOAuthProvider` silently did nothing.**
`Account.findById(accountId, { $push: {...} })` — the second argument to
`findById` is a field *projection*, not an update. Mongoose ignored the
`$push` entirely; linking a new OAuth provider to an existing
email/password account never actually persisted. No error, no crash —
just a permanently empty `authProviders` array on every account that hit
this path. Fixed by switching to
`findByIdAndUpdate(accountId, { $push: {...} }, { returnDocument: "after" })`.

LinkedIn was added later as a third provider, following the exact same
`providerMap` pattern — zero changes needed to `oauthRedirect` or
`oauthCallback` themselves, confirming the original design was genuinely
provider-agnostic.

---

## Phase 9: Password reset and email verification

**14. `emailVerificaiontToken` typo — the single most consequential typo
in the whole module.** `setEmailVerificationToken` wrote to a field
spelled with an extra "i"; the real schema field, `emailVerificationToken`
(spelled correctly), never received a value, since Mongoose's strict mode
silently drops writes to unrecognized paths. `findByVerificationToken`
queried the *correctly*-spelled field — which meant it could never find
anything, ever, because nothing had ever written to it. Every email
verification attempt failed with "invalid or expired," 100% of the time,
regardless of how fresh the token was.

**10 (again). `completeEmail`'s existence check was still inverted** when
Phase 9 testing began — the same bug pattern as #9, in a different
function, that had never actually been fixed here. Flipped the same way.

**24. `resendVerificationEmail` never sent anything.** Its "send" step was
still the original commented-out `queueEmail(...)` call — a function that
was never real anywhere in the codebase. The endpoint returned `200`
successfully while silently emailing nobody. Fixed by routing it (and
`registerUser`'s and `completeEmail`'s equivalents) through one shared
`sendVerificationEmail()` helper backed by the real `sendEmail()`.

**25. Status codes swapped.** `resendVerificationEmail` threw `badRequest`
(400) for "account not found" and `notFound` (404) for "account has no
email" — backwards; a missing account is a 404, an existing account in
the wrong state is a 400. Swapped to match.

**16. `updatePassword`'s missing `await`**, flagged in the original audit,
finally fixed in Phase 10: `account.save()` inside a `.then()` callback
wasn't awaited or returned, so the outer promise resolved before the write
completed and a failed save would become an unhandled rejection. (Still
dead code as of this writing — `resetPassword` does its own inline
save instead of calling this function.)

---

## Phase 10: Hardening

**26. `EMAIL_USER`/`EMAIL_PASS` bypassed env validation.**
`config/mail.ts` read `process.env.EMAIL_USER` directly, separate from the
Zod-validated `env.ts` every other config value goes through. A missing or
malformed value would fail silently, deep inside a `.catch()` during a
live request, instead of loudly at server boot like everything else. Moved
into `envSchema`.

**27. Mongoose deprecation warning.** `{ new: true }` on
`findByIdAndUpdate` calls (`setEmail`, and `addOAuthProvider` from fix #13)
is deprecated in favor of `{ returnDocument: "after" }` — same behavior,
newer API.

**19. Rate limiting, role checks, and optional auth were built but never
mounted anywhere.** `authRateLimit` was applied to register, login,
logout, refresh-token, forgot-password, and reset-password. Deliberately
**not** applied uniformly — `refresh-token` and `logout` share the limiter
with the others, a known tradeoff worth revisiting if legitimate users on
a shared IP (office wifi, NAT) ever get spuriously rate-limited, since
`express-rate-limit` buckets by IP, not by user.

---

## Bugs only automated testing caught

**28. Refresh tokens could collide within the same second.** The one
genuine defect the Supertest suite found that manual testing structurally
never could have. `generateRefreshToken`'s payload was just `{ userId }`;
JWT's `iat` claim has one-second granularity, so two tokens generated for
the same user within the same wall-clock second were byte-for-byte
identical — meaning a "rotated" refresh token could be indistinguishable
from the one it was meant to replace. A human clicking through Postman
naturally has seconds between actions; only a test firing requests
programmatically, back-to-back, was fast enough to expose this. Fixed by
adding a random `jti` claim to every refresh token.

Issues 29–32 (rate limiter vs. test traffic, in-memory MongoDB's
transaction requirements, index-build timing, and two TypeScript
strictness catches in the test code itself) are testing-environment
friction rather than application bugs — fully detailed in
`testing-bugs-found.md`.

---

## What this leaves

Not bugs, but worth knowing alongside this list:

- **The `users` module remains entirely unbuilt** — outlined in comments
  only, no controller, no routes. Never in scope for this remediation.
- **Google/GitHub OAuth are covered by mocked Supertest tests; LinkedIn
  is covered by both manual testing and its own mocked test file.**
- **`updatePassword` is fixed but still unexercised** — nothing in the
  current codebase calls it.
