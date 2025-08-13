"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KeyRound, LogOut, User2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({
  email,
  isAdmin = false,
}: {
  email: string | null | undefined;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith("/dashboard/admin");
  const isDashboardPath = pathname?.startsWith("/dashboard") && !isAdminPath;
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="shrink-0 text-sm font-semibold">
            SUBS
          </Link>
          <nav className="flex items-center gap-1">
            <Button
              asChild
              size="sm"
              variant={isDashboardPath ? "default" : "ghost"}
            >
              <Link
                href="/dashboard"
                aria-current={isDashboardPath ? "page" : undefined}
              >
                Dashboard
              </Link>
            </Button>
            {isAdmin ? (
              <Button
                asChild
                size="sm"
                variant={isAdminPath ? "default" : "ghost"}
              >
                <Link
                  href="/dashboard/admin"
                  aria-current={isAdminPath ? "page" : undefined}
                >
                  Administración
                </Link>
              </Button>
            ) : null}
          </nav>
          <div className="min-w-0 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Abrir menú de usuario"
              >
                <User2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {email || "Usuario"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/change-password"
                  className="inline-flex items-center gap-2 w-full cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" /> Cambiar contraseña
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form
                  action="/api/auth/signout"
                  method="post"
                  className="w-full inline-flex items-center gap-2"
                >
                  <button
                    type="submit"
                    className="w-full inline-flex items-center gap-2 text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Salir
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
