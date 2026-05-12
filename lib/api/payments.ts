import { api } from "./_client";

export interface InitPlanCheckoutInput {
  plan: "premium";
}

export interface InitCheckoutResult {
  provider: string;
  redirectUrl?: string;
  reference: string;
  accessCode?: string;
  amountNgn: number;
}

/** POST /api/payments/init — auth required. Starts a plan upgrade. */
export function initPlanCheckout(
  input: InitPlanCheckoutInput,
): Promise<InitCheckoutResult> {
  return api<InitCheckoutResult>("/api/payments/init", {
    method: "POST",
    body: input,
  });
}

/** GET /api/payments/verify/[ref] — verifies a Paystack callback. */
export function verifyPayment(reference: string): Promise<{
  ok: boolean;
  amountNgn?: number;
  status?: string;
}> {
  return api(`/api/payments/verify/${encodeURIComponent(reference)}`);
}
