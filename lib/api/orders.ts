import type { Order } from "@/lib/types";
import { api } from "./_client";

export interface CreateOrderItem {
  productId: string;
  variantId?: string | null;
  qty: number;
}

export interface CreateOrderInput {
  items: CreateOrderItem[];
  shipping: {
    fullName: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
  };
  paymentProvider?: "mock" | "paystack";
}

export interface CreateOrderResult {
  order: Order;
  redirectUrl?: string;
  reference: string;
}

/** POST /api/orders — auth required. Returns order + payment redirect. */
export function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  return api<CreateOrderResult>("/api/orders", {
    method: "POST",
    body: input,
  });
}

/** GET /api/orders/[id] — auth required, owner or admin. */
export function getOrderById(id: string): Promise<Order | null> {
  return api<Order | null>(`/api/orders/${encodeURIComponent(id)}`);
}

/**
 * Backend does not expose a list endpoint yet. Stub returns []; swap when the
 * route lands. Kept for signature parity with `lib/mock/orders.ts`.
 */
export async function listOrdersForUser(_userId: string): Promise<Order[]> {
  return [];
}
