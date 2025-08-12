export type ToastVariant = "default" | "success" | "warning" | "destructive";

type ToastEventDetail = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

export function toast(detail: ToastEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app:toast", { detail }));
}
