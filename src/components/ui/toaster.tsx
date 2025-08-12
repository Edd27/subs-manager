"use client";
import { useEffect, useState } from "react";
import { ToastVariant } from "./toast";

export default function Toaster() {
  const [items, setItems] = useState<
    {
      id: number;
      title?: string;
      description?: string;
      variant: ToastVariant;
    }[]
  >([]);
  useEffect(() => {
    function onToast(e: Event) {
      const ce = e as CustomEvent;
      const id = Date.now() + Math.random();
      const { title, description, variant } = (ce.detail || {}) as {
        title?: string;
        description?: string;
        variant?: ToastVariant;
      };
      setItems((prev) => [
        ...prev,
        { id, title, description, variant: variant || "default" },
      ]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 3500);
    }
    window.addEventListener("app:toast", onToast as EventListener);
    return () =>
      window.removeEventListener("app:toast", onToast as EventListener);
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {items.map((i) => (
        <div
          key={i.id}
          className={`rounded-md border px-4 py-3 shadow bg-white dark:bg-neutral-900 ${
            i.variant === "success"
              ? "border-green-600"
              : i.variant === "warning"
                ? "border-amber-600"
                : i.variant === "destructive"
                  ? "border-red-600"
                  : "border-neutral-300 dark:border-neutral-700"
          }`}
        >
          {i.title && <div className="font-medium mb-0.5">{i.title}</div>}
          {i.description && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {i.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
