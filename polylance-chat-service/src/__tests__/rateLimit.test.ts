import { describe, it, expect } from "vitest";
import { authLimiter, messageLimiter, joinLimiter, deleteLimiter, httpLimiter, isUpstashActive } from "../ratelimit.js";

describe("Chat service rate limiting", () => {
  it("reports the active rate limiting engine", () => {
    const active = isUpstashActive();
    console.log(`[RATE LIMIT TEST ENGINE]: ${active ? "Real Upstash Redis" : "In-Memory Sliding Window Fallback"}`);
    expect(typeof active).toBe("boolean");
  });
  it("blocks the 21st join-job-chat attempt within a minute", async () => {
    const wallet = "0x1111222233334444555566667777888899990001";
    let allowedCount = 0;

    for (let i = 1; i <= 25; i++) {
      const { success } = await joinLimiter.limit(wallet);
      if (success) {
        allowedCount++;
      }
    }

    expect(allowedCount).toBe(20);
  });

  it("blocks the 31st message within a minute", async () => {
    const wallet = "0x2222333344445555666677778888999900001112";
    let allowedCount = 0;

    for (let i = 1; i <= 35; i++) {
      const { success } = await messageLimiter.limit(wallet);
      if (success) {
        allowedCount++;
      }
    }

    expect(allowedCount).toBe(30);
  });

  it("does not block legitimate low-frequency usage", async () => {
    const wallet = "0x3333444455556666777788889999000011112223";
    
    for (let i = 1; i <= 5; i++) {
      const { success } = await messageLimiter.limit(wallet);
      expect(success).toBe(true);
    }
  });

  it("throttles excessive connection attempts per IP (10/min ceiling)", async () => {
    const ip = "192.168.1.100";
    let allowedCount = 0;

    for (let i = 1; i <= 15; i++) {
      const { success } = await authLimiter.limit(ip);
      if (success) {
        allowedCount++;
      }
    }

    expect(allowedCount).toBe(10);
  });

  it("throttles excessive HTTP requests per IP (60/min ceiling)", async () => {
    const ip = "10.0.0.50";
    let allowedCount = 0;

    for (let i = 1; i <= 65; i++) {
      const { success } = await httpLimiter.limit(ip);
      if (success) {
        allowedCount++;
      }
    }

    expect(allowedCount).toBe(60);
  });
});
