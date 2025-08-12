import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/lib/queue";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const payment = await prisma.payment.create({ data: parsed.data });
  const u = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (u?.email) {
    await emailQueue.add("payment-receipt", {
      to: u.email,
      subject: "Confirmación de pago",
      html: `<p>Pago recibido: $${Number(parsed.data.amount).toFixed(2)}</p>`,
    });
  }
  return NextResponse.json(payment);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "paidAt").toString();
  const dir =
    (searchParams.get("dir") || "desc").toLowerCase() === "asc"
      ? "asc"
      : "desc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 10))
  );
  const where = q
    ? {
        OR: [
          { method: { contains: q } },
          { notes: { contains: q } },
          { user: { is: { email: { contains: q } } } },
        ],
      }
    : {};
  const allowed = new Set(["paidAt", "amount", "method"]);
  const sortField = allowed.has(sort)
    ? (sort as "paidAt" | "amount" | "method")
    : "paidAt";
  let orderBy: Prisma.PaymentOrderByWithRelationInput;
  switch (sortField) {
    case "amount":
      orderBy = { amount: dir as Prisma.SortOrder };
      break;
    case "method":
      orderBy = { method: dir as Prisma.SortOrder };
      break;
    case "paidAt":
    default:
      orderBy = { paidAt: dir as Prisma.SortOrder };
  }
  const [total, items] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}
