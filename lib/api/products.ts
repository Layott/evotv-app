import type { Product } from "@/lib/types";
import { api, ApiError } from "./_client";

export interface ListProductsOpts {
  category?: Product["category"];
  featured?: boolean;
  teamId?: string;
}

/** GET /api/products?featured=&category=&teamId= */
export function listProducts(opts: ListProductsOpts = {}): Promise<Product[]> {
  return api<Product[]>("/api/products", {
    query: {
      featured: typeof opts.featured === "boolean" ? (opts.featured ? "1" : "0") : undefined,
      category: opts.category,
      teamId: opts.teamId,
    },
  });
}

/** GET /api/products/[id] — also accepts slug. Returns null on 404 so the
 *  caller can render a not-found state without a try/catch. */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await api<Product>(`/api/products/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Slug lookup hits the same endpoint server-side. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await api<Product>(`/api/products/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
