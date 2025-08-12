import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  method: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(
  req: NextRequest,
  context: Ctx
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const updated = await prisma.payment.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  context: Ctx
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.payment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
