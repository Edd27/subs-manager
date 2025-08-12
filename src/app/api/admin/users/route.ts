import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "createdAt").toString();
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
        OR: [{ email: { contains: q } }, { name: { contains: q } }],
      }
    : {};
  const allowed = new Set(["createdAt", "email", "name", "role"]);
  const sortField = allowed.has(sort)
    ? (sort as "createdAt" | "email" | "name" | "role")
    : "createdAt";
  let orderBy: Prisma.UserOrderByWithRelationInput;
  switch (sortField) {
    case "email":
      orderBy = { email: dir as Prisma.SortOrder };
      break;
    case "name":
      orderBy = { name: dir as Prisma.SortOrder };
      break;
    case "role":
      orderBy = { role: dir as Prisma.SortOrder };
      break;
    case "createdAt":
    default:
      orderBy = { createdAt: dir as Prisma.SortOrder };
  }
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}
