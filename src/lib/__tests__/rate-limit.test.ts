import * as redisMod from "@/lib/redis/client";
import { describe, expect, it, vi } from "vitest";

vi.spyOn(redisMod, "getRedis").mockReturnValue({
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
} as unknown as ReturnType<typeof redisMod.getRedis>);

import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows first request", async () => {
    const ok = await rateLimit("key", 5, 60);
    expect(ok).toBe(true);
  });
});
