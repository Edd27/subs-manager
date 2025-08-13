"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setStatus("idle");
            setLoading(true);
            const res = await fetch("/api/auth/change-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ current, next }),
            });
            setLoading(false);
            if (res.ok) {
              setStatus("success");
              setCurrent("");
              setNext("");
              router.replace("/dashboard");
            } else {
              setStatus("error");
            }
          }}
        >
          <CardContent className="space-y-4">
            {status === "success" && (
              <div
                className="text-sm text-emerald-600"
                role="status"
                aria-live="polite"
              >
                Contraseña actualizada
              </div>
            )}
            {status === "error" && (
              <div
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                Error al actualizar
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-sm" htmlFor="current">
                Actual
              </label>
              <Input
                id="current"
                type="password"
                value={current}
                autoComplete="current-password"
                onChange={(e) => setCurrent(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm" htmlFor="next">
                Nueva
              </label>
              <Input
                id="next"
                type="password"
                value={next}
                autoComplete="new-password"
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Actualizando...
                </>
              ) : (
                <>Actualizar</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
