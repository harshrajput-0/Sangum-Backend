import { ParsedQs } from "qs";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ─────────────────────────────────────────────────────────────────────────
 * Every list endpoint in this app (feed, comments, members, search
 * results...) needs the SAME three things: a sanitized page number, a
 * sanitized limit (capped so nobody can request 100,000 rows at once),
 * and a consistent meta object describing the result set. Without this,
 * every controller would hand-roll its own page/limit parsing with
 * slightly different edge-case bugs.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

/**
 * getPaginationParams
 *
 * Reads ?page= and ?limit= from the query string. Both are strings at
 * this point (Express doesn't parse query values as numbers), so we
 * parse and clamp them to sane bounds.
 */
export const getPaginationParams = (query: ParsedQs): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const requestedLimit = parseInt(query.limit as string, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * buildPaginationMeta
 *
 * Takes the total document count (from a separate .countDocuments()
 * call) plus the page/limit that were used, and returns everything
 * the frontend needs to render pagination controls or decide whether
 * to fire the next infinite-scroll request.
 */
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
