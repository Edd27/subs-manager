import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateStatementsForCurrentMonth } from "@/lib/statements/generate";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await generateStatementsForCurrentMonth();
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hasPaging = searchParams.has("page") || searchParams.has("pageSize");
  if (!hasPaging) {
    const items = await prisma.statement.findMany({ include: { items: true } });
    return NextResponse.json(items);
  }
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 10))
  );
  const [total, items] = await Promise.all([
    prisma.statement.count(),
    prisma.statement.findMany({
      include: { items: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}
