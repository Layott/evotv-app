import type { Order } from "@/lib/types";
import { api, ApiError } from "./_client";

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

/** GET /api/orders/[id] — auth required, owner or admin. Returns null on
 *  404 so the caller can render a "not found" state without a try/catch. */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    return await api<Order>(`/api/orders/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
      return null;
    }
    throw err;
  }
}

/**
 * GET /api/orders — current user's orders, newest first.
 * Note: backend resolves the user from the bearer; the userId arg is
 * retained for call-site compatibility with the old mock signature.
 */
export async function listOrdersForUser(_userId: string): Promise<Order[]> {
  const res = await api<{ orders: Order[] }>("/api/orders");
  return res.orders;
}
