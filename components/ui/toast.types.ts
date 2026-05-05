export type ToastVariant = "default" | "destructive";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}
