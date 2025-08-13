"use client";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, Loader2, Search, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type StatementItem = {
  id: string;
  statementId: string;
  userId: string;
  amountDue: number;
  status: "PENDING" | "PAID" | "CREDIT";
};

type Statement = {
  id: string;
  month: number;
  year: number;
  subscriptionId: string;
  items: StatementItem[];
};

type UserRow = { id: string; email: string };

export default function AdminStatements() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [pageBySt, setPageBySt] = useState<Record<string, number>>({});
  const [pageSize, setPageSize] = useState(10);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sizeKey = "stSize";
  const qKey = "stQ";

  useEffect(() => {
    let abort = false;
    async function load() {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "100");
      const [stRes, usrRes] = await Promise.all([
        fetch(`/api/statements?${params.toString()}`),
        fetch("/api/admin/users?page=1&pageSize=100&sort=email&dir=asc"),
      ]);
      if (!abort) {
        if (stRes.ok) {
          const data: { items: Statement[]; total: number } | Statement[] =
            await stRes.json();
          if (Array.isArray(data)) {
            setStatements(data);
          } else {
            setStatements(data.items);
          }
        }
        if (usrRes.ok) {
          const u = await usrRes.json();
          setUsers(Array.isArray(u) ? u : (u.items ?? []));
        }
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const s = parseInt(searchParams.get(sizeKey) || "10");
    const nextPages: Record<string, number> = {};
    for (const [k, v] of Array.from(searchParams.entries())) {
      if (k.startsWith("st_")) {
        const id = k.slice(3);
        const p = parseInt(v);
        if (!Number.isNaN(p)) nextPages[id] = p;
      }
    }
    if (!Number.isNaN(s) && s !== pageSize) setPageSize(s);
    const q = searchParams.get(qKey) || "";
    if (q !== query) setQuery(q);
    setPageBySt((prev) => ({ ...prev, ...nextPages }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    if ((searchParams.get(sizeKey) || "10") !== String(pageSize)) {
      params.set(sizeKey, String(pageSize));
      changed = true;
    }
    for (const [id, p] of Object.entries(pageBySt)) {
      const key = `st_${id}`;
      if ((searchParams.get(key) || "1") !== String(p)) {
        params.set(key, String(p));
        changed = true;
      }
    }
    const curQ = searchParams.get(qKey) || "";
    const nextQ = query.trim();
    if (curQ !== nextQ) {
      if (nextQ) params.set(qKey, nextQ);
      else params.delete(qKey);
      changed = true;
    }
    if (changed)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageBySt, pageSize, query, router, pathname]);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/statements", { method: "POST" });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
        toast("Estados generados");
      } else {
        toast("Error al generar los estados");
      }
    } finally {
      setLoading(false);
    }
  }

  async function patchItem(id: string, body: Partial<StatementItem>) {
    const res = await fetch(`/api/admin/statement-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setRefreshKey((k) => k + 1);
      toast("Elemento actualizado");
    } else {
      toast("Error al actualizar el elemento");
    }
  }

  async function removeItem(id: string) {
    const res = await fetch(`/api/admin/statement-items/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRefreshKey((k) => k + 1);
      toast("Elemento eliminado");
    } else {
      toast("Error al eliminar el elemento");
    }
  }

  const has = useMemo(() => statements.length > 0, [statements]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex gap-3">
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Generando...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Generar estados mes
                actual
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium inline-flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Estados de cuenta
          </h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 w-[260px]"
            />
          </div>
        </div>
        {!has ? (
          <div className="text-sm text-neutral-500">Sin estados</div>
        ) : (
          <div className="overflow-x-auto">
            {statements.map((st) => {
              const q = query.toLowerCase().trim();
              const filteredItems = q
                ? st.items.filter((it) => {
                    const email =
                      users.find((u) => u.id === it.userId)?.email || "";
                    return email.toLowerCase().includes(q);
                  })
                : st.items;
              if (filteredItems.length === 0) return null;
              const total = filteredItems.length;
              const key = st.id;
              const current = pageBySt[key] || 1;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
              const start = (current - 1) * pageSize;
              const end = Math.min(start + pageSize, total);
              const pageItems = filteredItems.slice(start, end);
              return (
                <div key={st.id} className="mb-6">
                  <div className="font-medium mb-2">
                    {st.month}/{st.year} — {st.subscriptionId}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">Usuario</th>
                        <th className="py-2 pr-4">Monto</th>
                        <th className="py-2 pr-4">Estado</th>
                        <th className="py-2 pr-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((it) => (
                        <tr key={it.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 align-middle">
                            {users.find((u) => u.id === it.userId)?.email ||
                              it.userId}
                          </td>
                          <td className="py-2 pr-4 align-middle">
                            ${""}
                            {Number(it.amountDue).toFixed(2)}
                          </td>
                          <td className="py-2 pr-4 align-middle">
                            <Select
                              value={it.status}
                              onValueChange={(v) =>
                                patchItem(it.id, {
                                  status: v as "PENDING" | "PAID" | "CREDIT",
                                })
                              }
                            >
                              <SelectTrigger size="sm" className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">
                                  PENDIENTE
                                </SelectItem>
                                <SelectItem value="PAID">PAGADO</SelectItem>
                                <SelectItem value="CREDIT">CRÉDITO</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 pr-4 align-middle">
                            <ConfirmButton
                              onConfirm={() => removeItem(it.id)}
                              title="Borrar ítem"
                              description="Esta acción es irreversible."
                              label={
                                <span className="inline-flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" /> Borrar
                                </span>
                              }
                              variant="destructive"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <div>
                      Mostrando {total === 0 ? 0 : start + 1}–{end} de {total}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                          setPageSize(parseInt(v));
                          setPageBySt((prev) => {
                            const entries = Object.keys(prev).map(
                              (k) => [k, 1] as const
                            );
                            return Object.fromEntries(entries);
                          });
                        }}
                      >
                        <SelectTrigger size="sm" className="w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setPageBySt((prev) => ({
                              ...prev,
                              [key]: Math.max(1, (prev[key] || 1) - 1),
                            }))
                          }
                          disabled={current <= 1}
                        >
                          Anterior
                        </Button>
                        <div>
                          Página {current} de {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setPageBySt((prev) => ({
                              ...prev,
                              [key]: Math.min(totalPages, (prev[key] || 1) + 1),
                            }))
                          }
                          disabled={current >= totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
