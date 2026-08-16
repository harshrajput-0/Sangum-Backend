// Single source of truth for username shape. Imported by user.model.ts
// (Mongoose `match`), auth.validaton.ts (register), and
// user.validation.ts (onboarding) so the three layers can't drift out
// of sync the way they previously did.
//
// Rule: letters (either case) + numbers, with '.', '-', '_' allowed as
// separators — but never consecutive and never at the start/end.
// "john_doe", "john.doe-99" are valid; "_john", "john..doe", "john_"
// are not.
export const USERNAME_REGEX = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/;

export const USERNAME_MIN_LENGTH = 5;
export const USERNAME_MAX_LENGTH = 20;

export const USERNAME_RULE_MESSAGE =
  "Username can contain letters, numbers, dots, hyphens, and underscores, but can't start or end with one or use two in a row";
