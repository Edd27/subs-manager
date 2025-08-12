import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis/client";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  monthlyCost: z.coerce.number().positive(),
  maxProfiles: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const service = await prisma.service.create({
    data: {
      name: parsed.data.name,
      monthlyCost: parsed.data.monthlyCost,
      maxProfiles: parsed.data.maxProfiles,
    },
  });
  return NextResponse.json(service);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hasPaging =
    searchParams.has("page") ||
    searchParams.has("pageSize") ||
    searchParams.has("q");
  if (!hasPaging) {
    const redis = getRedis();
    const key = "services:active";
    const cached = await redis.get(key);
    if (cached) return NextResponse.json(JSON.parse(cached));
    const services = await prisma.service.findMany({
      where: { isActive: true },
    });
    await redis.set(key, JSON.stringify(services), "EX", 60);
    return NextResponse.json(services);
  }
  const q = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "name").toString();
  const dir =
    (searchParams.get("dir") || "asc").toLowerCase() === "desc"
      ? "desc"
      : "asc";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || 10))
  );
  const redis = getRedis();
  const cacheKey = `services:active:q:${q}:p:${page}:s:${pageSize}:sort:${sort}:dir:${dir}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  const where = {
    isActive: true,
    ...(q
      ? {
          name: { contains: q, mode: "insensitive" as const },
        }
      : {}),
  };
  const allowed = new Set(["name", "monthlyCost", "maxProfiles", "isActive"]);
  const sortField = allowed.has(sort)
    ? (sort as "name" | "monthlyCost" | "maxProfiles" | "isActive")
    : "name";
  let orderBy: Prisma.ServiceOrderByWithRelationInput;
  switch (sortField) {
    case "monthlyCost":
      orderBy = { monthlyCost: dir as Prisma.SortOrder };
      break;
    case "maxProfiles":
      orderBy = { maxProfiles: dir as Prisma.SortOrder };
      break;
    case "isActive":
      orderBy = { isActive: dir as Prisma.SortOrder };
      break;
    case "name":
    default:
      orderBy = { name: dir as Prisma.SortOrder };
  }
  const [total, items] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const payload = { items, total, page, pageSize };
  await redis.set(cacheKey, JSON.stringify(payload), "EX", 60);
  return NextResponse.json(payload);
}
