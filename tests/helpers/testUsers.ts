// Registration now requires a unique username (see auth.validaton.ts /
// user.model.ts). Every test that hits POST /auth/register needs one —
// this generates a short, rule-compliant, collision-safe value so tests
// don't have to hand-roll one (and don't collide with each other when
// run in the same file).
let counter = 0;

export function uniqueUsername(prefix = "user"): string {
  counter += 1;
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${prefix}${counter}${suffix}`;
}
