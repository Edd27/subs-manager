import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const vt = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!vt || vt.expires < new Date())
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { email: vt.identifier },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const hash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, mustChangePassword: false },
    }),
    prisma.verificationToken.delete({ where: { token: parsed.data.token } }),
  ]);
  return NextResponse.json({ ok: true });
}
