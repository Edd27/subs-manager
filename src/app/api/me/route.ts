import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      profiles: {
        include: { subscription: { include: { service: true } } },
        where: { isActive: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [dueAgg, paymentsAgg, recentPayments] = await Promise.all([
    prisma.statementItem.aggregate({
      _sum: { amountDue: true },
      where: { userId: user.id },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { userId: user.id },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
  ]);
  const due = Number(dueAgg._sum.amountDue || 0);
  const paid = Number(paymentsAgg._sum.amount || 0);

  const base = {
    me: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    balance: { balance: paid - due, due, paid },
    mySubscriptions: user.profiles.map((p) => ({
      id: p.subscription.id,
      service: p.subscription.service.name,
      monthlyCost: Number(p.subscription.service.monthlyCost),
      startDate: p.subscription.startDate,
    })),
    recentPayments,
  };

  if (user.role === "ADMIN") {
    const [usersCount, servicesCount, subsCount, statementsCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.service.count({ where: { isActive: true } }),
        prisma.subscription.count({ where: { isActive: true } }),
        prisma.statement.count(),
      ]);
    return NextResponse.json({
      ...base,
      adminOverview: { usersCount, servicesCount, subsCount, statementsCount },
    });
  }

  return NextResponse.json(base);
}
