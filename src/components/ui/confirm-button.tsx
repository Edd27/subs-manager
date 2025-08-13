"use client";
import { useState } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

type Props = {
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  label?: React.ReactNode;
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
