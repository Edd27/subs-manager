import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminPayments from "./payments";
import AdminServices from "./services";
import AdminStatements from "./statements";
import AdminSubscriptions from "./subscriptions";
import AdminUsers from "./users";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Administración</h2>
      <div className="divide-y">
        <section className="py-6 first:pt-0">
          <AdminUsers />
        </section>
        <section className="py-6">
          <AdminServices />
        </section>
        <section className="py-6">
          <AdminSubscriptions />
        </section>
        <section className="py-6">
          <AdminPayments />
        </section>
        <section className="py-6">
          <AdminStatements />
        </section>
      </div>
    </div>
  );
}
