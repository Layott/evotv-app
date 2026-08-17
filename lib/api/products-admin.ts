import type { Product, ProductVariant } from "@/lib/types";
import { api } from "./_client";

/**
 * The shop, from the dashboard.
 *
 * `lib/api/products.ts` reads the public catalogue, which only ever returns
 * what is on sale. Managing the shop needs the admin endpoints: they return
 * hidden products too, and they are the only way to write one.
 *
 * `/api/admin/products` reads at `support_admin` and writes at `admin`, so
 * support can answer "is this in stock" without being able to change the price.
 */

/**
 * A product as the admin endpoint returns it.
 *
 * `showId` is not on the shared `Product` type because the public catalogue
 * does not surface it, but the admin list and the write routes both carry it:
 * it is what puts a product on a show's page.
 */
export interface AdminProduct extends Product {
  showId: string | null;
}

export interface ProductInput {
  name: string;
  description: string;
  category: Product["category"];
  priceNgn: number;
  images: string[];
  variants: ProductVariant[];
  featured: boolean;
  active: boolean;
  teamId: string | null;
  showId: string | null;
  inventory: number;
}

/** GET /api/admin/products - support_admin+. Includes hidden products. */
export async function adminListProducts(): Promise<{
  products: AdminProduct[];
  total: number;
}> {
  return api("/api/admin/products");
}

/** POST /api/admin/products - admin+. The shop URL comes from the name. */
export async function adminCreateProduct(
  input: ProductInput,
): Promise<AdminProduct> {
  const res = await api<{ product: AdminProduct }>("/api/admin/products", {
    method: "POST",
    body: input,
  });
  return res.product;
}

/** PATCH /api/admin/products/[id] - admin+. */
export async function adminUpdateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<AdminProduct> {
  const res = await api<{ product: AdminProduct }>(
    `/api/admin/products/${encodeURIComponent(id)}`,
    { method: "PATCH", body: patch },
  );
  return res.product;
}

/**
 * DELETE /api/admin/products/[id] - admin+.
 *
 * The server decides between deleting the row and hiding it: a product somebody
 * has ordered is kept, because every order stores its line items by product id
 * and a deleted row would leave old orders pointing at nothing. The response
 * says which happened, so the screen can report it rather than guess.
 */
export async function adminRemoveProduct(id: string): Promise<{
  ok: true;
  productId: string;
  deactivated: boolean;
  message?: string;
}> {
  return api(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
