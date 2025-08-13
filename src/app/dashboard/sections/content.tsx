import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react";
import { cookies } from "next/headers";

async function fetchMe() {
  const c = await cookies();
  const res = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/me`,
    {
      headers: { cookie: c.toString() },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

type MeResponse = {
  me: {
    id: string;
    email: string | null;
    name: string | null;
    role: "ADMIN" | "USER";
  };
  balance: { balance: number; due: number; paid: number };
  mySubscriptions: {
    id: string;
    service: string;
    monthlyCost: number;
    startDate: string;
  }[];
  recentPayments: {
    id: string;
    amount: number;
    paidAt: string;
    method: string;
  }[];
  adminOverview?: {
    usersCount: number;
    servicesCount: number;
    subsCount: number;
    statementsCount: number;
  };
};

export default async function DashboardContent() {
  const data = await fetchMe();
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">
        Bienvenido{data.me.name ? ", " + data.me.name : ""}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Balance"
          value={`$${data.balance.balance.toFixed(2)}`}
          variant={data.balance.balance >= 0 ? "success" : "warning"}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Pagado"
          value={`$${data.balance.paid.toFixed(2)}`}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatCard
          title="Adeudo"
          value={`$${data.balance.due.toFixed(2)}`}
          icon={<Banknote className="h-4 w-4" />}
        />
        {data.adminOverview && (
          <StatCard
            title="Usuarios"
            value={data.adminOverview.usersCount}
            icon={<Users className="h-4 w-4" />}
          />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mis suscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {data.mySubscriptions.map(
                (s: MeResponse["mySubscriptions"][number]) => (
                  <li
                    key={s.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {s.service}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge>${s.monthlyCost.toFixed(2)}</Badge>
                    </div>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pagos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {data.recentPayments.map(
                (p: MeResponse["recentPayments"][number]) => (
                  <li
                    key={p.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {new Date(p.paidAt).toLocaleDateString()}
                    </span>
                    <Badge>${Number(p.amount).toFixed(2)}</Badge>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  variant = "default",
  icon,
}: {
  title: string;
  value: string | number;
  variant?: "default" | "success" | "warning";
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          {icon}
          {title}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {variant !== "default" && (
          <div className="mt-2">
            <Badge variant={variant}>
              {variant === "success" ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> A favor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Pendiente
                </span>
              )}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
