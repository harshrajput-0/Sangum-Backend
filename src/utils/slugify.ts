import { Model } from "mongoose";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * WHY TWO FUNCTIONS INSTEAD OF ONE
 * ─────────────────────────────────────────────────────────────────────────
 * slugify() is pure and synchronous — text in, slug out, no DB involved.
 * generateUniqueSlug() is the one that actually touches the database,
 * because "is this slug already taken" can only be answered by asking
 * the collection. Keeping them separate means slugify() is trivially
 * unit-testable without mocking Mongoose.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // strip anything that isn't a letter/number/space/hyphen
    .replace(/[\s_]+/g, "-")    // spaces and underscores become hyphens
    .replace(/-+/g, "-")        // collapse multiple hyphens
    .replace(/^-|-$/g, "");     // trim leading/trailing hyphens
};

/**
 * generateUniqueSlug
 *
 * Takes a base string, slugifies it, then checks the given model's
 * collection for collisions. If "hello-world" is taken, tries
 * "hello-world-1", then "hello-world-2", and so on.
 *
 * USAGE (in post.service.ts):
 *   const slug = await generateUniqueSlug(title, Post);
 *
 * Why this lives here instead of in each service: every module that
 * needs a slug (posts, communities, resources) would otherwise
 * duplicate this exact loop.
 */
export const generateUniqueSlug = async (
  text: string,
  model: Model<any>,
  excludeId?: string
): Promise<string> => {
  const baseSlug = slugify(text);
  let slug = baseSlug;
  let counter = 1;

  // Loop until we find a slug nobody else has. excludeId lets an UPDATE
  // operation check uniqueness while ignoring the document's own
  // current slug (otherwise editing a post without changing its title
  // would falsely think the slug is "taken" by itself).
  while (
    await model.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};
