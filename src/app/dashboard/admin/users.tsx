"use client";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
};

const allowedUserSort = ["createdAt", "email", "name", "role"] as const;
type UserSort = (typeof allowedUserSort)[number];

export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [temp, setTemp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<UserSort>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pageKey = "usersPage";
  const sizeKey = "usersSize";
  const qKey = "usersQ";
  const sortKey = "usersSort";
  const dirKey = "usersDir";

  async function createUser() {
    setTemp(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setTemp(data.tempPassword);
        setEmail("");
        setName("");
        setRole("USER");
        setRefreshKey((k) => k + 1);
        toast({
          title: "Usuario creado",
          description: email,
          variant: "success",
        });
      } else {
        const err = (data as { error?: string } | null)?.error || "";
        toast({
          title: "Error al crear",
          description: err,
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
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) return;
      const data: {
        items: UserRow[];
        total: number;
        page: number;
        pageSize: number;
      } = await res.json();
      if (!abort) {
        setUsers(data.items);
        setTotal(data.total);
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [refreshKey, query, page, pageSize, sort, dir]);

  async function updateUser(
    id: string,
    patch: Partial<Pick<UserRow, "name" | "role">> & { resetPassword?: boolean }
  ) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data.user } : u))
      );
      if (data.tempPassword) setTemp(data.tempPassword as string);
      toast({ title: "Usuario actualizado", variant: "success" });
    } else {
      toast({
        title: "Error al actualizar",
        description: data.error || "",
        variant: "destructive",
      });
    }
  }

  async function removeUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast({ title: "Usuario borrado", variant: "success" });
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

  const hasUsers = useMemo(() => users.length > 0, [users]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = users;
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
    let so: UserSort = "createdAt";
    if (soRaw && (allowedUserSort as readonly string[]).includes(soRaw))
      so = soRaw as UserSort;
    const di: "asc" | "desc" = diRaw === "asc" ? "asc" : "desc";
    if (so !== sort) setSort(so);
    if (di !== dir) setDir(di);
  }, [searchParams, page, pageSize, query, sort, dir]);

  useEffect(() => {
    const curP = searchParams.get(pageKey) || "1";
    const curS = searchParams.get(sizeKey) || "10";
    const curQ = searchParams.get(qKey) || "";
    const curSo = searchParams.get(sortKey) || "createdAt";
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
          >
            <option value="USER">Usuario</option>
            <option value="ADMIN">Admin</option>
          </select>
          <Input
            placeholder="Buscar usuarios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="md:col-span-2"
          />
          <Button onClick={createUser} disabled={loading}>
            {loading ? "Creando..." : "Crear usuario"}
          </Button>
        </div>
        {temp && (
          <div className="text-sm">
            Contraseña temporal: <span className="font-mono">{temp}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Usuarios</h3>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {total} resultados
          </div>
        </div>
        {!hasUsers ? (
          <div className="text-sm text-neutral-500">Sin usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">
                    <button
                      className="hover:underline"
                      onClick={() => {
                        if (sort === "email")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("email");
                          setDir("asc");
                        }
                      }}
                    >
                      Email{" "}
                      {sort === "email" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
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
                        if (sort === "role")
                          setDir(dir === "asc" ? "desc" : "asc");
                        else {
                          setSort("role");
                          setDir("asc");
                        }
                      }}
                    >
                      Rol {sort === "role" ? (dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  </th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 align-middle">{u.email}</td>
                    <td className="py-2 pr-4 align-middle">
                      <InlineEdit
                        value={u.name ?? ""}
                        onSave={(val) => updateUser(u.id, { name: val })}
                      />
                    </td>
                    <td className="py-2 pr-4 align-middle">
                      <select
                        className="border rounded px-2 py-1"
                        value={u.role}
                        onChange={(e) =>
                          updateUser(u.id, {
                            role: e.target.value as "ADMIN" | "USER",
                          })
                        }
                      >
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 pr-4 align-middle space-x-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          updateUser(u.id, { resetPassword: true })
                        }
                      >
                        Reset pass
                      </Button>
                      <ConfirmButton
                        onConfirm={() => removeUser(u.id)}
                        title="Borrar usuario"
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
