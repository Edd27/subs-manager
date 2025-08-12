"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (res?.error) {
            setError("Credenciales inválidas");
          } else {
            window.location.href = "/";
          }
        }}
      >
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm">Email</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Contraseña</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full bg-black text-white rounded px-4 py-2"
          type="submit"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
