import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/lib/queue";

export async function generateStatementsForCurrentMonth() {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const subs = await prisma.subscription.findMany({
    where: { isActive: true },
    include: {
      service: true,
      profiles: { where: { isActive: true }, include: { user: true } },
    },
  });
  for (const sub of subs) {
    const activeProfiles = sub.profiles.length;
    if (!activeProfiles) continue;
    const amountPerUser = Number(sub.service.monthlyCost) / activeProfiles;
    const statement = await prisma.statement.upsert({
      where: {
        month_year_subscriptionId: { month, year, subscriptionId: sub.id },
      },
      create: { month, year, subscriptionId: sub.id },
      update: {},
    });
    for (const p of sub.profiles) {
      await prisma.statementItem.upsert({
        where: {
          statementId_userId: { statementId: statement.id, userId: p.userId },
        },
        create: {
          statementId: statement.id,
          userId: p.userId,
          amountDue: amountPerUser,
        },
        update: { amountDue: amountPerUser },
      });
      if (p.user.email) {
        await emailQueue.add("monthly-statement", {
          to: p.user.email,
          subject: `Estado de cuenta ${month}/${year}`,
          html: `<p>Tu cargo para ${sub.service.name}: $${amountPerUser.toFixed(2)}</p>`,
        });
      }
    }
  }
  return { ok: true };
}
