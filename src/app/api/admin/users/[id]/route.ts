import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  resetPassword: z.boolean().optional(),
});

function genTempPassword() {
  const a = Math.random().toString(36).slice(-6);
  const b = Math.random().toString(36).slice(-6);
  return `${a}${b}`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  
  let tempPassword: string | undefined;
  const data: {
    name?: string;
    role?: "ADMIN" | "USER";
    passwordHash?: string;
    mustChangePassword?: boolean;
  } = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.resetPassword) {
    tempPassword = genTempPassword();
    data.passwordHash = await bcrypt.hash(tempPassword, 10);
    data.mustChangePassword = true;
  }
  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json({ user, tempPassword });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
