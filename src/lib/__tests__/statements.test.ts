import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "s1",
          service: { name: "Test", monthlyCost: 10 },
          profiles: [{ userId: "u1", user: { email: "u1@test" } }],
        },
      ]),
    },
    statement: { upsert: vi.fn().mockResolvedValue({ id: "st1" }) },
    statementItem: { upsert: vi.fn().mockResolvedValue({}) },
  },
}));

const { addMock } = vi.hoisted(() => ({
  addMock: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/queue", () => ({ emailQueue: { add: addMock } }));

import { generateStatementsForCurrentMonth } from "@/lib/statements/generate";

describe("generate statements", () => {
  it("enqueues emails", async () => {
    const res = await generateStatementsForCurrentMonth();
    expect(res.ok).toBe(true);
    expect(addMock).toHaveBeenCalled();
  });
});
