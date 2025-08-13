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
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const res = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            setLoading(false);
            if (res?.error) {
              setError("Credenciales inválidas");
              return;
            }
            window.location.href = "/";
          }}
        >
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-sm" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm" htmlFor="password">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                <>Entrar</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
