import { syncGet, syncSet } from "@/lib/storage/persist";

export const CART_KEY = "evotv:cart";
export const ORDERS_KEY = "evotv:orders";

export interface CartLine {
  productId: string;
  variantId: string | null;
  qty: number;
}

const subscribers = new Set<() => void>();
function emit() {
  subscribers.forEach((fn) => fn());
}

function readCart(): CartLine[] {
  try {
    const raw = syncGet(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]): void {
  syncSet(CART_KEY, JSON.stringify(lines));
  emit();
}

export function subscribeCart(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

export function getCart(): CartLine[] {
  return readCart();
}

export function addLine(line: CartLine): void {
  const cart = readCart();
  const existing = cart.findIndex(
    (l) => l.productId === line.productId && l.variantId === line.variantId,
  );
  if (existing >= 0) {
    cart[existing] = { ...cart[existing]!, qty: cart[existing]!.qty + line.qty };
  } else {
    cart.push(line);
  }
  writeCart(cart);
}

export function updateQty(
  productId: string,
  variantId: string | null,
  qty: number,
): void {
  const cart = readCart();
  const idx = cart.findIndex(
    (l) => l.productId === productId && l.variantId === variantId,
  );
  if (idx === -1) return;
  if (qty <= 0) cart.splice(idx, 1);
  else cart[idx] = { ...cart[idx]!, qty };
  writeCart(cart);
}

export function removeLine(productId: string, variantId: string | null): void {
  const cart = readCart().filter(
    (l) => !(l.productId === productId && l.variantId === variantId),
  );
  writeCart(cart);
}

export function clearCart(): void {
  writeCart([]);
}

export function readLocalOrders(): unknown[] {
  try {
    const raw = syncGet(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushLocalOrder(order: unknown): void {
  const arr = readLocalOrders();
  arr.unshift(order);
  syncSet(ORDERS_KEY, JSON.stringify(arr));
}
