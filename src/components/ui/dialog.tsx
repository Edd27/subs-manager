"use client";
import * as React from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        {title && <div className="text-base font-semibold mb-2">{title}</div>}
        <div className="mb-3">{children}</div>
        <div className="flex items-center justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}
