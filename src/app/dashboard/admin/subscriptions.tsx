"use client";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Service = { id: string; name: string };

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
};

type Subscription = {
  id: string;
  service: { id: string; name: string };
  owner: { id: string; email: string };
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  profiles: { id: string; userId: string; isActive: boolean }[];
};

const allowedSort = ["startDate", "endDate", "isActive"] as const;
type SortField = (typeof allowedSort)[number];

export default function AdminSubscriptions() {
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortField>("startDate");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageKey = "subsPage";
  const sizeKey = "subsSize";
  const qKey = "subsQ";
  const sortKey = "subsSort";
  const dirKey = "subsDir";

  useEffect(() => {
    let abort = false;
    async function load() {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sort", sort);
      params.set("dir", dir);
      const [srvRes, usrRes, subRes] = await Promise.all([
        fetch(`/api/services`),
        fetch(`/api/admin/users?page=1&pageSize=100&sort=email&dir=asc`),
        fetch(`/api/subscriptions?${params.toString()}`),
      ]);
      if (!abort) {
        if (srvRes.ok) setServices(await srvRes.json());
        if (usrRes.ok) {
          const u = await usrRes.json();
          setUsers(Array.isArray(u) ? u : (u.items ?? []));
        }
        if (subRes.ok) {
          const data: { items: Subscription[]; total: number } =
            await subRes.json();
          setSubs(data.items);
          setTotal(data.total);
        }
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [refreshKey, query, page, pageSize, sort, dir]);

  const hasSubs = useMemo(() => subs.length > 0, [subs]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = subs;
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
    let so: SortField = "startDate";
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
    const curSo = searchParams.get(sortKey) || "startDate";
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

  async function createSub() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, ownerId, startDate }),
      });
      if (res.ok) {
        setServiceId("");
        setOwnerId("");
        setStartDate(new Date().toISOString().slice(0, 10));
        setRefreshKey((k) => k + 1);
        toast({ title: "Suscripción creada", variant: "success" });
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          title: "Error al crear",
          description: data?.error || "",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function patch(
    id: string,
    body: Partial<
      Pick<Subscription, "startDate" | "endDate" | "isActive"> & {
        serviceId?: string;
        ownerId?: string;
      }
    >
  ) {
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated: Subscription = await res.json();
      setSubs((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast({ title: "Suscripción actualizada", variant: "success" });
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
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSubs((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Suscripción borrada", variant: "success" });
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

  async function addProfile(subscriptionId: string, userId: string) {
    const res = await fetch(`/api/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId, userId }),
    });
    if (res.ok) setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <select
            className="border rounded px-3 py-2"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            <option value="">Servicio</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="">Propietario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            placeholder="Buscar suscripciones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:col-span-3"
          />
          <Button
            onClick={createSub}
            disabled={loading || !serviceId || !ownerId}
          >
            {loading ? "Creando..." : "Crear suscripción"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Suscripciones</h3>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {total} resultados
          </div>
        </div>
        {!hasSubs ? (
          <div className="text-sm text-neutral-500">Sin suscripciones</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Servicio</th>
                  <th className="py-2 pr-4">Propietario</th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "startDate")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("startDate");
                          setDir("desc");
                        }
                      }}
                    >
                      Inicio{" "}
                      {sort === "startDate" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "endDate")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("endDate");
                          setDir("desc");
                        }
                      }}
                    >
                      Fin{" "}
                      {sort === "endDate" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "isActive")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("isActive");
                          setDir("desc");
                        }
                      }}
                    >
                      Activa{" "}
                      {sort === "isActive" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="py-2 pr-4">Perfiles</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 align-middle">{s.service.name}</td>
                    <td className="py-2 pr-4 align-middle">{s.owner.email}</td>
                    <td className="py-2 pr-4 align-middle">
                      {new Date(s.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      {s.endDate
                        ? new Date(s.endDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <Button
                        variant="outline"
                        onClick={() => patch(s.id, { isActive: !s.isActive })}
                      >
                        {s.isActive ? "Activa" : "Inactiva"}
                      </Button>
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      {s.profiles.filter((p) => p.isActive).length}
                      <ProfileAdder
                        users={users}
                        onAdd={(userId) => addProfile(s.id, userId)}
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle space-x-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          patch(s.id, { endDate: new Date().toISOString() })
                        }
                      >
                        Finalizar hoy
                      </Button>
                      <ConfirmButton
                        onConfirm={() => remove(s.id)}
                        title="Borrar suscripción"
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

function ProfileAdder({
  users,
  onAdd,
}: {
  users: UserRow[];
  onAdd: (userId: string) => void;
}) {
  const [uid, setUid] = useState("");
  return (
    <div className="mt-2 flex items-center gap-2">
      <select
        className="border rounded px-2 py-1"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
      >
        <option value="">Agregar perfil...</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.email}
          </option>
        ))}
      </select>
      <Button disabled={!uid} onClick={() => uid && onAdd(uid)}>
        Añadir
      </Button>
    </div>
  );
}
