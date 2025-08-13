"use client";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ui/confirm-button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowUpDown,
  CalendarClock,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
  const [startDate, setStartDate] = useState<Date>(new Date());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  useEffect(() => {
    const curP = searchParams.get(pageKey) || "1";
    const curS = searchParams.get(sizeKey) || "10";
    const curQ = searchParams.get(qKey) || "";
    const curSo = searchParams.get(sortKey) || "startDate";
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

  async function createSub() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          ownerId,
          startDate: new Date(startDate).toISOString().slice(0, 10),
        }),
      });
      if (res.ok) {
        setServiceId("");
        setOwnerId("");
        setStartDate(new Date());
        setRefreshKey((k) => k + 1);
        toast("Suscripción creada");
      } else {
        toast("Error al crear la suscripción");
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
      toast("Suscripción actualizada");
    } else {
      toast("Error al actualizar la suscripción");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSubs((prev) => prev.filter((s) => s.id !== id));
      toast("Suscripción eliminada");
    } else {
      toast("Error al eliminar la suscripción");
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
          <Select value={serviceId || undefined} onValueChange={setServiceId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ownerId || undefined} onValueChange={setOwnerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Propietario" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePicker
            value={startDate}
            onChange={(d) => d && setStartDate(d)}
          />
          <Button
            onClick={createSub}
            disabled={loading || !serviceId || !ownerId}
          >
            {loading ? (
              "Creando..."
            ) : (
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Crear suscripción
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium inline-flex items-center gap-2">
            <Users className="h-4 w-4" /> Suscripciones
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar suscripciones..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-[240px]"
              />
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {total} resultados
            </div>
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
                      <span className="inline-flex items-center gap-1">
                        Inicio <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
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
                      <span className="inline-flex items-center gap-1">
                        Fin <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
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
                      <span className="inline-flex items-center gap-1">
                        Activa <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
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
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={s.isActive}
                          onCheckedChange={(v) => {
                            setSubs((prev) =>
                              prev.map((it) =>
                                it.id === s.id ? { ...it, isActive: v } : it
                              )
                            );
                            patch(s.id, { isActive: v }).catch(() => {
                              setSubs((prev) =>
                                prev.map((it) =>
                                  it.id === s.id ? { ...it, isActive: !v } : it
                                )
                              );
                            });
                          }}
                          aria-label={
                            s.isActive
                              ? "Desactivar suscripción"
                              : "Activar suscripción"
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {s.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>
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
                        <CalendarClock className="h-4 w-4 mr-1" /> Finalizar hoy
                      </Button>
                      <ConfirmButton
                        onConfirm={() => remove(s.id)}
                        title="Borrar suscripción"
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
      <Select value={uid || undefined} onValueChange={setUid}>
        <SelectTrigger size="sm" className="w-[200px]">
          <SelectValue placeholder="Agregar perfil..." />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button disabled={!uid} onClick={() => uid && onAdd(uid)}>
        <UserPlus className="h-4 w-4 mr-1" /> Añadir
      </Button>
    </div>
  );
}
