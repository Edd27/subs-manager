"use client";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type UserRow = { id: string; email: string; name: string | null };

type Payment = {
  id: string;
  userId: string;
  amount: number;
  paidAt: string;
  method: string;
  notes?: string | null;
};

const allowedSort = ["paidAt", "amount", "method"] as const;
type SortField = (typeof allowedSort)[number];

export default function AdminPayments() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("efectivo");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortField>("paidAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageKey = "paymentsPage";
  const sizeKey = "paymentsSize";
  const qKey = "paymentsQ";
  const sortKey = "paymentsSort";
  const dirKey = "paymentsDir";

  useEffect(() => {
    let abort = false;
    async function load() {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sort", sort);
      params.set("dir", dir);
      const [usrRes, payRes] = await Promise.all([
        fetch("/api/admin/users?page=1&pageSize=100&sort=email&dir=asc"),
        fetch(`/api/payments?${params.toString()}`),
      ]);
      if (!abort) {
        if (usrRes.ok) {
          const u = await usrRes.json();
          setUsers(Array.isArray(u) ? u : (u.items ?? []));
        }
        if (payRes.ok) {
          const data: { items: Payment[]; total: number } = await payRes.json();
          setPayments(data.items);
          setTotal(data.total);
        }
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [refreshKey, query, page, pageSize, sort, dir]);

  async function createPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: Number(amount), method, notes }),
      });
      if (res.ok) {
        setUserId("");
        setAmount("");
        setMethod("efectivo");
        setNotes("");
        setRefreshKey((k) => k + 1);
        toast({ title: "Pago registrado", variant: "success" });
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          title: "Error al registrar",
          description: data?.error || "",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function patch(id: string, body: Partial<Payment>) {
    const res = await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated: Payment = await res.json();
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast({ title: "Pago actualizado", variant: "success" });
    } else {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      toast({
        title: "Error al actualizar",
        description: data?.error || "",
        variant: "destructive",
      });
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/payments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Pago borrado", variant: "success" });
    } else {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      toast({
        title: "Error al borrar",
        description: data?.error || "",
        variant: "destructive",
      });
    }
  }

  const has = useMemo(() => payments.length > 0, [payments]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = payments;
  useEffect(() => {
    setPage(1);
  }, [query, sort, dir]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
  useEffect(() => {
    const p = parseInt(searchParams.get(pageKey) || "1");
    const s = parseInt(searchParams.get(sizeKey) || "10");
    const q = searchParams.get(qKey) || "";
    if (!Number.isNaN(p) && p !== page) setPage(p);
    if (!Number.isNaN(s) && s !== pageSize) setPageSize(s);
    if (q !== query) setQuery(q);
    const soRaw = searchParams.get(sortKey);
    const diRaw = searchParams.get(dirKey);
    let so: SortField = "paidAt";
    if (soRaw && (allowedSort as readonly string[]).includes(soRaw))
      so = soRaw as SortField;
    const di: "asc" | "desc" = diRaw === "asc" ? "asc" : "desc";
    if (so !== sort) setSort(so);
    if (di !== dir) setDir(di);
  }, [searchParams, page, pageSize, query, sort, dir]);
  useEffect(() => {
    const curP = searchParams.get(pageKey) || "1";
    const curS = searchParams.get(sizeKey) || "10";
    const curQ = searchParams.get(qKey) || "";
    const curSo = searchParams.get(sortKey) || "paidAt";
    const curDi = searchParams.get(dirKey) || "desc";
    const nextP = String(page);
    const nextS = String(pageSize);
    const nextQ = query;
    const nextSo = sort;
    const nextDi = dir;
    if (
      curP === nextP &&
      curS === nextS &&
      curQ === nextQ &&
      curSo === nextSo &&
      curDi === nextDi
    )
      return;
    const params = new URLSearchParams(searchParams);
    params.set(pageKey, nextP);
    params.set(sizeKey, nextS);
    if (nextQ.trim()) params.set(qKey, nextQ.trim());
    else params.delete(qKey);
    params.set(sortKey, nextSo);
    params.set(dirKey, nextDi);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, pageSize, sort, dir, query, searchParams, router, pathname]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <select
            className="border rounded px-3 py-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
          <Input
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder="Método"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          />
          <Input
            placeholder="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Input
            placeholder="Buscar pagos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:col-span-2"
          />
          <Button
            onClick={createPayment}
            disabled={loading || !userId || !amount}
          >
            {loading ? "Creando..." : "Registrar pago"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Pagos</h3>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {total} resultados
          </div>
        </div>
        {!has ? (
          <div className="text-sm text-neutral-500">Sin pagos</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "amount")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("amount");
                          setDir("asc");
                        }
                      }}
                    >
                      Monto{" "}
                      {sort === "amount" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "paidAt")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("paidAt");
                          setDir("desc");
                        }
                      }}
                    >
                      Fecha{" "}
                      {sort === "paidAt" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "method")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("method");
                          setDir("asc");
                        }
                      }}
                    >
                      Método{" "}
                      {sort === "method" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="py-2 pr-4">Notas</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 align-middle">
                      {users.find((u) => u.id === p.userId)?.email || p.userId}
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <InlineEdit
                        value={String(p.amount)}
                        onSave={(v) => patch(p.id, { amount: Number(v) })}
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      {new Date(p.paidAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <InlineEdit
                        value={p.method}
                        onSave={(v) => patch(p.id, { method: v })}
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <InlineEdit
                        value={p.notes || ""}
                        onSave={(v) => patch(p.id, { notes: v })}
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <ConfirmButton
                        onConfirm={() => remove(p.id)}
                        title="Borrar pago"
                        description="Esta acción es irreversible."
                        label="Borrar"
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
                <select
                  className="border rounded px-2 py-1"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </Button>
                  <div>
                    Página {page} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InlineEdit({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  if (!editing)
    return (
      <div className="flex items-center gap-2">
        <span>{value || "—"}</span>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Editar
        </Button>
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <Input value={val} onChange={(e) => setVal(e.target.value)} />
      <Button
        onClick={() => {
          onSave(val);
          setEditing(false);
        }}
      >
        Guardar
      </Button>
      <Button variant="secondary" onClick={() => setEditing(false)}>
        Cancelar
      </Button>
    </div>
  );
}
