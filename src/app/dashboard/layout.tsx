import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userWithFlag = session.user as typeof session.user & {
    mustChangePassword?: boolean;
  };
  if (userWithFlag?.mustChangePassword) redirect("/change-password");
  return (
    <div className="min-h-screen p-6 container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{session.user?.email}</div>
        <div className="flex gap-2">
          <Link href="/change-password" className="text-sm underline">
            Cambiar contraseña
          </Link>
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </div>
      {session.user?.mustChangePassword && (
        <div className="rounded-md border p-3 text-sm bg-yellow-50 dark:bg-yellow-900/20">
          Debes cambiar tu contraseña. Ve a{" "}
          <Link href="/change-password" className="underline">
            Cambiar contraseña
          </Link>
          .
        </div>
      )}
      {children}
    </div>
  );
}
