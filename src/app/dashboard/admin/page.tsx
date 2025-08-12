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
      <AdminUsers />
      <AdminServices />
      <AdminSubscriptions />
      <AdminPayments />
      <AdminStatements />
    </div>
  );
}
