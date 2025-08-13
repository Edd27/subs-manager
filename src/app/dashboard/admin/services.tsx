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
import { Switch } from "@/components/ui/switch";
import {
  ArrowUpDown,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Service = {
  id: string;
  name: string;
  monthlyCost: number;
  maxProfiles: number;
  isActive: boolean;
};

const allowedSort = ["name", "monthlyCost", "maxProfiles", "isActive"] as const;
type SortField = (typeof allowedSort)[number];

export default function AdminServices() {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [maxProfiles, setMaxProfiles] = useState("4");
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortField>("name");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageKey = "servicesPage";
  const sizeKey = "servicesSize";
  const qKey = "servicesQ";
  const sortKey = "servicesSort";
  const dirKey = "servicesDir";

  async function createService() {
    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          monthlyCost: Number(cost),
          maxProfiles: Number(maxProfiles),
        }),
      });
      if (res.ok) {
        setName("");
        setCost("");
        setMaxProfiles("4");
        setRefreshKey((k) => k + 1);
        toast("Servicio creado");
      } else {
        toast("Error al crear servicio");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let abort = false;
    async function load() {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sort", sort);
      params.set("dir", dir);
      const res = await fetch(`/api/services?${params.toString()}`);
      if (!res.ok) return;
      const data: { items: Service[]; total: number } | Service[] =
        await res.json();
      if (Array.isArray(data)) {
        if (!abort) {
          setServices(data);
          setTotal(data.length);
        }
      } else if (!abort) {
        setServices(data.items);
        setTotal(data.total);
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [refreshKey, query, page, pageSize, sort, dir]);

  async function patch(id: string, body: Partial<Service>) {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated: Service = await res.json();
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast("Servicio actualizado");
    } else {
      toast("Error al actualizar el servicio");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast("Servicio eliminado");
    } else {
      toast("Error al eliminar el servicio");
    }
  }

  const has = useMemo(() => services.length > 0, [services]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = services;
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
    let so: SortField = "name";
    if (soRaw && (allowedSort as readonly string[]).includes(soRaw))
      so = soRaw as SortField;
    const di: "asc" | "desc" = diRaw === "desc" ? "desc" : "asc";
    if (so !== sort) setSort(so);
    if (di !== dir) setDir(di);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  useEffect(() => {
    const curP = searchParams.get(pageKey) || "1";
    const curS = searchParams.get(sizeKey) || "10";
    const curQ = searchParams.get(qKey) || "";
    const curSo = searchParams.get(sortKey) || "name";
    const curDi = searchParams.get(dirKey) || "asc";
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
  }, [page, pageSize, sort, dir, query, pathname]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <Input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Costo mensual"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
          <Input
            placeholder="Máx perfiles"
            value={maxProfiles}
            onChange={(e) => setMaxProfiles(e.target.value)}
          />
          <Button onClick={createService} disabled={loading}>
            {loading ? (
              "Creando..."
            ) : (
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Crear servicio
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium inline-flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Servicios
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios..."
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
          <div className="text-sm text-neutral-500">Sin servicios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "name")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("name");
                          setDir("asc");
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Nombre <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "monthlyCost")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("monthlyCost");
                          setDir("asc");
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Costo <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </th>
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "maxProfiles")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("maxProfiles");
                          setDir("asc");
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Máx perfiles <ArrowUpDown className="h-3.5 w-3.5" />
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
                          setDir("asc");
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Activo <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 align-middle">
                      <InlineEdit
                        value={s.name}
                        onSave={(val) => patch(s.id, { name: val })}
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <InlineEdit
                        value={String(s.monthlyCost)}
                        onSave={(val) =>
                          patch(s.id, { monthlyCost: Number(val) })
                        }
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <InlineEdit
                        value={String(s.maxProfiles)}
                        onSave={(val) =>
                          patch(s.id, { maxProfiles: Number(val) })
                        }
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={s.isActive}
                          onCheckedChange={(v) => {
                            setServices((prev) =>
                              prev.map((it) =>
                                it.id === s.id ? { ...it, isActive: v } : it
                              )
                            );
                            patch(s.id, { isActive: v }).catch(() => {
                              setServices((prev) =>
                                prev.map((it) =>
                                  it.id === s.id ? { ...it, isActive: !v } : it
                                )
                              );
                            });
                          }}
                          aria-label={
                            s.isActive
                              ? "Desactivar servicio"
                              : "Activar servicio"
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {s.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 align-middle space-x-2">
                      <ConfirmButton
                        onConfirm={() => remove(s.id)}
                        title="Borrar servicio"
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
        <span>{value}</span>
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
