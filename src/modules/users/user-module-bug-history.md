# Users module — bug history

The `users` module didn't exist before onboarding — model, repository,
validation, and types were scaffolded but there was no controller, no
service, no routes, nothing mounted. This covers what went wrong while
actually building it out: one real routing bug (found through the same
Supertest-driven process as the auth module), plus the test-suite issues
specific to file uploads and username generation.

For the auth-side changes that landed alongside this (`GET /auth/me`,
OAuth avatar seeding), see `auth-module-bug-history.md` — kept separate
since that one's a pre-existing module with its own long history, and
mixing the two would make neither easy to skim.

---

## Summary

| # | Issue | Found by | Severity |
|---|---|---|---|
| 1 | `/api/v1/user` route-mount typo — singular instead of plural | Supertest suite | Blocking |
| 2 | Auto-generated username could violate the tightened charset regex | Manual regex testing (no live DB needed) | Medium |
| 3 | `req.body` could be `undefined` on a fully-empty onboarding submission | Static review, before any test ran | Medium |
| 4 | `uploadToCloudinary`'s temp file only got cleaned up on failure | Static review | Low |

---

## 1. `/api/v1/user` vs `/api/v1/users` — one-character route-mount typo

**Found by:** Every test in `tests/users/onboarding.test.ts`, all failing
identically
**Status:** Fixed

### Symptom

```
AssertionError: onboarding POST failed: {}: expected 404 to be 200
```

Every single onboarding request came back `404` — not a validation
error, not an auth error, a flat "no route matched this path."

### Root cause

```ts
// src/app.ts — wrong
app.use(`${API_PREFIX}/user`, userRoutes);

// correct
app.use(`${API_PREFIX}/users`, userRoutes);
```

The route handlers, controller, service, and validation were all correct
and present. The mount itself just used the singular form, while every
test and the documented frontend contract used the plural
`/api/v1/users/onboarding`.

This traces back to a workflow issue, not a typing mistake in isolation:
the onboarding module's files were shared as a zip download partway
through the build. Reviewing "the current file" kept coming back clean
during debugging, because the file being reviewed on the writing side and
the file actually deployed on the running side had quietly diverged — a
change described in conversation, and believed to have shipped, that
never actually landed in the real checkout. The same root cause produced
a second, unrelated bug — a missing OAuth avatar-seed line, documented as
bug #33 in `auth-module-bug-history.md` — later in the same debugging
session, which is what made the pattern actually visible. Fixed going
forward by pasting every code change inline in conversation for direct
copy-paste, instead of bundling changes into a zip.

### Fix

One-line mount correction. No application logic needed to change at all.

---

## 2. Auto-generated usernames needed hardening against the tightened charset

**Found by:** Manual reasoning while tightening the username regex to
block leading/trailing/consecutive dots and hyphens (not by a live test —
this one was caught and fixed before ever running against a database)
**Status:** Fixed proactively

### The risk

Two separate changes landed close together:

1. The username charset opened up to allow `.` and `-` (previously
   `[a-z0-9_]` only).
2. The regex was then tightened again to reject leading/trailing dots or
   hyphens, and consecutive ones (`--`, `..`, `.-`).

`sanitizeUsernameBase()` — which builds a candidate username from an
email's local-part when the user leaves the field blank — strips
disallowed characters but, at the time, didn't defend against the *new*
tightened rules. Two concrete cases would have silently generated a
username the app's own validator would then reject:

- **The 14-character slice landing right after a dot.** An email local-part
  like `abcdefghijklm.nopqr`, truncated to the generator's 14-char cap,
  becomes `abcdefghijklm.` — a trailing dot the tightened regex rejects.
- **Local-parts with leading dots or internal runs**, e.g. `.hidden@...`
  or `first..last@...`, which the model now explicitly disallows.

### Fix

```ts
const sanitizeUsernameBase = (raw: string): string => {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/[.-]{2,}/g, (run) => run[0] as string)   // collapse runs to one
    .replace(/^[.-]+|[.-]+$/g, "");                     // trim both ends

  // The slice can itself land right after a dot/hyphen — trim again.
  return cleaned.slice(0, 14).replace(/[.-]+$/, "");
};
```

Verified directly against the exact edge cases above (and others:
`---`, `first.-last`, a bare `a`) by running the regex and sanitizer as
plain functions outside the test suite, since this didn't require a
database to check — pure string-in, string-out logic.

---

## 3. `req.body` could be `undefined` on a fully-empty onboarding submission

**Found by:** Static review, reasoning through the "click continue on
everything" skip path before ever running the test that exercises it
**Status:** Fixed proactively

### The risk

Neither `express.json()` nor `multer`'s `.single("avatar")` populate
`req.body` when a request's content type doesn't match what they expect.
A client submitting the full-skip case as a genuinely empty POST (no
multipart fields at all) could reach the Zod validation step with
`req.body === undefined` — which fails Zod's object schema before it even
looks at individual fields, misreporting a client-side "nothing to
validate" case as a `400`.

### Fix

```ts
// src/modules/users/user.routes.ts
const handleAvatarUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadAvatar.single("avatar")(req, res, (err: unknown) => {
    if (err) { /* ... */ }
    req.body = req.body ?? {};   // <- guard
    next();
  });
};
```

---

## 4. `uploadToCloudinary`'s temp file only got cleaned up on the failure path

**Found by:** Static review of the existing (pre-onboarding) utility while
wiring the avatar upload flow into it
**Status:** Fixed

### The bug

```ts
// before
const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
// await fs.unlink(localFilePath);   <- commented out
return response;
```

Every successful upload left its Multer-written temp file behind in
`os.tmpdir()`/`sangam-uploads`. Only the `catch` block cleaned up — meaning
the *common* path leaked a file per avatar upload, and only the rare
failure path was actually tidy.

### Fix

```ts
const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
try {
  await fs.unlink(localFilePath);
} catch {}
return response;
```

Pre-existing bug in code this module didn't originally write, but it sat
directly in the avatar-upload path this feature now exercises on every
request that includes a file — worth fixing in place rather than adding a
second cleanup mechanism around it.

---

## What this covers, and what it doesn't

- **In scope:** everything under `src/modules/users/`, `src/config/multer.ts`,
  and the onboarding-specific parts of `src/app.ts`.
- **Not in scope, documented elsewhere:** `GET /auth/me` and OAuth avatar
  seeding live in `auth.services.ts` and are covered in
  `auth-module-bug-history.md`'s Phase 11, even though they were built
  alongside this module and in service of it.
- **Test coverage:** `tests/users/onboarding.test.ts` (19 cases: manual
  and auto-generated usernames, charset edge cases, file upload via
  mocked Cloudinary, non-image rejection, double-completion rejection,
  OAuth-seeded avatar preservation, missing-auth) and
  `tests/auth/me.test.ts` (5 cases, since `/auth/me` was built in service
  of this module even though it lives in `auth.services.ts`).