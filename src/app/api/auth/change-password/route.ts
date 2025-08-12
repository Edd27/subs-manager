import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  current: z.string().min(8),
  next: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ok = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!ok)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const hash = await bcrypt.hash(parsed.data.next, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  return NextResponse.json({ ok: true });
}
