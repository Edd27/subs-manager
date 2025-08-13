import Header from "@/components/layout/header";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header
        email={session.user?.email}
        isAdmin={session.user?.role === "ADMIN"}
      />
      <main className="mx-auto min-h-[calc(100vh-56px)] w-full max-w-7xl p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
