import { describe, it, expect, beforeEach, vi } from "vitest";
import { RateLimiter } from "@/lib/server/auth/rate-limit";
import { db } from "@/lib/server/db";
import { loginAttempts } from "@/lib/server/db/schema";
import { eq, and, gt } from "drizzle-orm";

vi.mock("@/lib/server/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiter = new RateLimiter();
  });

  describe("checkLoginAttempt", () => {
    it("should allow login when no previous attempts", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await rateLimiter.checkLoginAttempt("test@example.com");

      expect(result.allowed).toBe(true);
      expect(result.requiresCaptcha).toBe(false);
      expect(result.remainingAttempts).toBe(5);
    });

    it("should require CAPTCHA after 3 failed attempts", async () => {
      const windowStart = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              identifier: "test@example.com",
              attempts: 3,
              windowStart,
              lockedUntil: null,
            },
          ]),
        }),
      } as any);

      const result = await rateLimiter.checkLoginAttempt("test@example.com");

      expect(result.requiresCaptcha).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it("should block login when account locked", async () => {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min future
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              identifier: "test@example.com",
              attempts: 5,
              windowStart: new Date(Date.now() - 5 * 60 * 1000),
              lockedUntil,
            },
          ]),
        }),
      } as any);

      const result = await rateLimiter.checkLoginAttempt("test@example.com");

      expect(result.allowed).toBe(false);
      expect(result.lockedUntil).toEqual(lockedUntil);
      expect(result.remainingAttempts).toBe(0);
    });

    it("should calculate remaining attempts correctly", async () => {
      const windowStart = new Date(Date.now() - 5 * 60 * 1000);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              identifier: "test@example.com",
              attempts: 2,
              windowStart,
              lockedUntil: null,
            },
          ]),
        }),
      } as any);

      const result = await rateLimiter.checkLoginAttempt("test@example.com");

      expect(result.remainingAttempts).toBe(3); // 5 - 2
    });

    it("should handle IP-based rate limiting", async () => {
      const windowStart = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: 1,
              identifier: "192.168.1.1",
              attempts: 8,
              windowStart,
              lockedUntil: null,
            },
          ]),
        }),
      } as any);

      const result = await rateLimiter.checkLoginAttempt("192.168.1.1");

      expect(result.remainingAttempts).toBe(2); // 10 - 8 (IP threshold is 10)
    });
  });

  describe("recordFailedLogin", () => {
    it("should create new record for first failure", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 1,
              identifier: "test@example.com",
              attempts: 1,
              windowStart: new Date(),
              lockedUntil: null,
            },
          ]),
        }),
      } as any);

      await rateLimiter.recordFailedLogin("test@example.com");

      expect(db.insert).toHaveBeenCalledWith(loginAttempts);
    });

    it("should increment attempts for existing record", async () => {
      const existing = {
        id: 1,
        identifier: "test@example.com",
        attempts: 2,
        windowStart: new Date(Date.now() - 5 * 60 * 1000),
        lockedUntil: null,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existing]),
        }),
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      await rateLimiter.recordFailedLogin("test@example.com");

      expect(db.update).toHaveBeenCalledWith(loginAttempts);
    });

    it("should set lockedUntil when threshold reached", async () => {
      const existing = {
        id: 1,
        identifier: "test@example.com",
        attempts: 4, // Next attempt will be 5th
        windowStart: new Date(Date.now() - 5 * 60 * 1000),
        lockedUntil: null,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existing]),
        }),
      } as any);

      const updateMock = vi.fn().mockResolvedValue([]);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: updateMock,
        }),
      } as any);

      await rateLimiter.recordFailedLogin("test@example.com");

      // Verify lockedUntil was set
      const setCall = (db.update as any).mock.results[0].value.set.mock.calls[0][0];
      expect(setCall.lockedUntil).toBeInstanceOf(Date);
    });
  });

  describe("resetLoginAttempts", () => {
    it("should delete all attempts for identifier", async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      } as any);

      await rateLimiter.resetLoginAttempts("test@example.com");

      expect(db.delete).toHaveBeenCalledWith(loginAttempts);
    });
  });

  describe("sliding window algorithm", () => {
    it("should ignore attempts outside 15-minute window", async () => {
      const oldAttempt = {
        id: 1,
        identifier: "test@example.com",
        attempts: 3,
        windowStart: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago (outside window)
        lockedUntil: null,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // Should filter out old attempts
        }),
      } as any);

      const result = await rateLimiter.checkLoginAttempt("test@example.com");

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it("should use 1-hour window for IP addresses", async () => {
      // IP addresses should have a 60-minute window instead of 15
      const recentAttempt = {
        id: 1,
        identifier: "192.168.1.1",
        attempts: 5,
        windowStart: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
        lockedUntil: null,
      };

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([recentAttempt]),
        }),
      } as any);

      const result = await rateLimiter.checkLoginAttempt("192.168.1.1");

      // Should still count attempts within 1-hour window
      expect(result.remainingAttempts).toBeLessThan(10);
    });
  });

  describe("unlockAccount", () => {
    it("should verify token and reset attempts", async () => {
      // Mock verification token lookup
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              identifier: "test@example.com",
              token: "valid-token-hash",
              expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour future
            },
          ]),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockSelect);

      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await rateLimiter.unlockAccount(
        "test@example.com",
        "valid-token"
      );

      expect(result).toBe(true);
      expect(db.delete).toHaveBeenCalledTimes(2); // Delete attempts + token
    });

    it("should reject expired tokens", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              identifier: "test@example.com",
              token: "expired-token",
              expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour past
            },
          ]),
        }),
      } as any);

      const result = await rateLimiter.unlockAccount(
        "test@example.com",
        "expired-token"
      );

      expect(result).toBe(false);
    });

    it("should reject invalid tokens", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await rateLimiter.unlockAccount(
        "test@example.com",
        "invalid-token"
      );

      expect(result).toBe(false);
    });
  });
});
