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
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [dueAgg, paymentsAgg] = await Promise.all([
    prisma.statementItem.aggregate({
      _sum: { amountDue: true },
      where: { userId: user.id },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { userId: user.id },
    }),
  ]);
  const due = Number(dueAgg._sum.amountDue || 0);
  const paid = Number(paymentsAgg._sum.amount || 0);
  return NextResponse.json({ balance: paid - due, due, paid });
}
