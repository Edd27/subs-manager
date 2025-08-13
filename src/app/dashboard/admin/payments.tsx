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
import {
  ArrowUpDown,
  CreditCard,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
        toast("Pago registrado");
      } else {
        toast("Error al registrar el pago");
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
      toast("Pago actualizado");
    } else {
      toast("Error al actualizar el pago");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/payments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast("Pago eliminado");
    } else {
      toast("Error al eliminar el pago");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  useEffect(() => {
    const curP = searchParams.get(pageKey) || "1";
    const curS = searchParams.get(sizeKey) || "10";
    const curQ = searchParams.get(qKey) || "";
    const curSo = searchParams.get(sortKey) || "paidAt";
    const curDi = searchParams.get(dirKey) || "desc";
    const nextP = String(page);
    const nextS = String(pageSize);
    const nextQ = query.trim();
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
    if (nextQ) params.set(qKey, nextQ);
    else params.delete(qKey);
    params.set(sortKey, nextSo);
    params.set(dirKey, nextDi);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sort, dir, query, router, pathname]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Usuario" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="deposito">Depósito</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            onClick={createPayment}
            disabled={loading || !userId || !amount}
          >
            {loading ? (
              "Creando..."
            ) : (
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Registrar pago
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium inline-flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Pagos
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pagos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-[220px]"
              />
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {total} resultados
            </div>
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
                      <span className="inline-flex items-center gap-1">
                        Monto <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
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
                      <span className="inline-flex items-center gap-1">
                        Fecha <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
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
                      <span className="inline-flex items-center gap-1">
                        Método <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
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
                      <Select
                        value={p.method}
                        onValueChange={(v) => patch(p.id, { method: v })}
                      >
                        <SelectTrigger size="sm" className="min-w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="deposito">Depósito</SelectItem>
                          <SelectItem value="transferencia">
                            Transferencia
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                    setPage(1);
                  }}
                >
                  <SelectTrigger size="sm" className="w-[90px]">
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
          <Pencil className="h-4 w-4 mr-1" /> Editar
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
        <Save className="h-4 w-4 mr-1" /> Guardar
      </Button>
      <Button variant="secondary" onClick={() => setEditing(false)}>
        <X className="h-4 w-4 mr-1" /> Cancelar
      </Button>
    </div>
  );
}
