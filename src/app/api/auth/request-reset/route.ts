import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/lib/queue";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) return NextResponse.json({ ok: true });
  const token =
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const expires = new Date(Date.now() + 1000 * 60 * 30);
  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  });
  await emailQueue.add("password-reset", {
    to: user.email,
    subject: "Recupera tu contraseña",
    html: `<p>Usa este token para recuperar tu contraseña: ${token}</p>`,
  });
  return NextResponse.json({ ok: true });
}
