"use client";
import { useState } from "react";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current, next }),
          });
          if (res.ok) setMsg("Contraseña actualizada");
          else setMsg("Error al actualizar");
        }}
      >
        <h1 className="text-2xl font-semibold">Cambiar contraseña</h1>
        {msg && <p className="text-sm">{msg}</p>}
        <div className="space-y-2">
          <label className="block text-sm">Actual</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Nueva</label>
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full bg-black text-white rounded px-4 py-2"
          type="submit"
        >
          Actualizar
        </button>
      </form>
    </div>
  );
}
