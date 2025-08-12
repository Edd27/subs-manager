import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  serviceId: z.string().min(1),
  ownerId: z.string().min(1),
  startDate: z.coerce.date(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const sub = await prisma.subscription.create({
    data: {
      serviceId: parsed.data.serviceId,
      ownerId: parsed.data.ownerId,
      startDate: parsed.data.startDate,
    },
  });
  return NextResponse.json(sub);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 10))
  );
  const sort = (searchParams.get("sort") || "startDate").toString();
  const dir =
    (searchParams.get("dir") || "desc").toLowerCase() === "asc"
      ? "asc"
      : "desc";
  const where = q
    ? {
        OR: [
          { service: { is: { name: { contains: q } } } },
          { owner: { is: { email: { contains: q } } } },
        ],
      }
    : {};
  const allowed = new Set(["startDate", "endDate", "isActive"]);
  const sortField = allowed.has(sort)
    ? (sort as "startDate" | "endDate" | "isActive")
    : "startDate";
  let orderBy: Prisma.SubscriptionOrderByWithRelationInput;
  switch (sortField) {
    case "endDate":
      orderBy = { endDate: dir as Prisma.SortOrder };
      break;
    case "isActive":
      orderBy = { isActive: dir as Prisma.SortOrder };
      break;
    case "startDate":
    default:
      orderBy = { startDate: dir as Prisma.SortOrder };
  }
  const [total, items] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      include: { service: true, owner: true, profiles: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}
