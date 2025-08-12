"use client";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
        toast({
          title: "Servicio creado",
          description: name,
          variant: "success",
        });
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
      toast({ title: "Servicio actualizado", variant: "success" });
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
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Servicio borrado", variant: "success" });
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
    const di: "asc" | "desc" = diRaw === "asc" ? "asc" : "desc";
    if (so !== sort) setSort(so);
    if (di !== dir) setDir(di);
  }, [searchParams, page, pageSize, query, sort, dir]);
  useEffect(() => {
    const curP = searchParams.get(pageKey) || "1";
    const curS = searchParams.get(sizeKey) || "10";
    const curQ = searchParams.get(qKey) || "";
    const curSo = searchParams.get(sortKey) || "name";
    const curDi = searchParams.get(dirKey) || "asc";
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
          <Input
            placeholder="Buscar servicios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:col-span-2"
          />
          <Button onClick={createService} disabled={loading}>
            {loading ? "Creando..." : "Crear servicio"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Servicios</h3>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {total} resultados
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
                      Nombre{" "}
                      {sort === "name" ? (dir === "asc" ? "▲" : "▼") : ""}
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
                      Costo{" "}
                      {sort === "monthlyCost"
                        ? dir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
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
                      Máx perfiles{" "}
                      {sort === "maxProfiles"
                        ? dir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
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
                      Activo{" "}
                      {sort === "isActive" ? (dir === "asc" ? "▲" : "▼") : ""}
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
                      <Button
                        variant="outline"
                        onClick={() => patch(s.id, { isActive: !s.isActive })}
                      >
                        {s.isActive ? "Activo" : "Inactivo"}
                      </Button>
                    </td>
                    <td className="py-2 pr-4 align-middle space-x-2">
                      <ConfirmButton
                        onConfirm={() => remove(s.id)}
                        title="Borrar servicio"
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
        <span>{value}</span>
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
