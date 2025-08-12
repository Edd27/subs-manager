"use client";
import { useState } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

type Props = {
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  label?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
};

export default function ConfirmButton({
  onConfirm,
  title = "Confirmar acción",
  description,
  label = "Borrar",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {cancelText}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setLoading(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? "Procesando..." : confirmText}
            </Button>
          </>
        }
      >
        {description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        )}
      </Dialog>
    </>
  );
}
