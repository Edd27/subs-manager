import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  subscriptionId: z.string().min(1),
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const count = await prisma.profile.count({
    where: { subscriptionId: parsed.data.subscriptionId, isActive: true },
  });
  const sub = await prisma.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
    include: { service: true },
  });
  if (!sub)
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  if (count >= sub.service.maxProfiles)
    return NextResponse.json(
      { error: "Max profiles reached" },
      { status: 400 }
    );
  const profile = await prisma.profile.create({
    data: {
      subscriptionId: parsed.data.subscriptionId,
      userId: parsed.data.userId,
    },
  });
  return NextResponse.json(profile);
}
