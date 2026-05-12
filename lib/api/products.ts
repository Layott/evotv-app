import type { Product } from "@/lib/types";
import { api } from "./_client";

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

/** GET /api/products/[id] — also accepts slug. */
export function getProductById(id: string): Promise<Product | null> {
  return api<Product | null>(`/api/products/${encodeURIComponent(id)}`);
}

/** Slug lookup hits the same endpoint server-side. */
export function getProductBySlug(slug: string): Promise<Product | null> {
  return api<Product | null>(`/api/products/${encodeURIComponent(slug)}`);
}
