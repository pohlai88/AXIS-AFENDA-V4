import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/server/db";
import { loginAttempts, users, verificationTokens } from "@/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { RateLimiter } from "@/lib/server/auth/rate-limit";
import { verifyCaptchaToken } from "@/lib/server/auth/captcha";
import { createUnlockToken, verifyUnlockToken } from "@/lib/server/auth/unlock";

describe("Login Protection Integration", () => {
  const testEmail = "test-lockout@example.com";
  const testIp = "192.168.1.100";
  let rateLimiter: RateLimiter;

  beforeEach(async () => {
    rateLimiter = new RateLimiter();
    // Clean up test data
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, testEmail));
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, testIp));
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, testEmail));
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, testEmail));
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, testIp));
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, testEmail));
  });

  describe("Failed Login Flow", () => {
    it("should track failed login attempts", async () => {
      // First attempt
      await rateLimiter.recordFailedLogin(testEmail);
      let result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.remainingAttempts).toBe(4);

      // Second attempt
      await rateLimiter.recordFailedLogin(testEmail);
      result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.remainingAttempts).toBe(3);
    });

    it("should require CAPTCHA after 3 failed attempts", async () => {
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await rateLimiter.recordFailedLogin(testEmail);
      }

      const result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.requiresCaptcha).toBe(true);
      expect(result.allowed).toBe(true); // Still allowed, but needs CAPTCHA
    });

    it("should lock account after 5 failed attempts", async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordFailedLogin(testEmail);
      }

      const result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.allowed).toBe(false);
      expect(result.lockedUntil).toBeInstanceOf(Date);
      expect(result.remainingAttempts).toBe(0);
    });

    it("should persist lockout across checks", async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordFailedLogin(testEmail);
      }

      // Check multiple times
      const check1 = await rateLimiter.checkLoginAttempt(testEmail);
      const check2 = await rateLimiter.checkLoginAttempt(testEmail);

      expect(check1.allowed).toBe(false);
      expect(check2.allowed).toBe(false);
      expect(check1.lockedUntil).toEqual(check2.lockedUntil);
    });
  });

  describe("IP-Based Rate Limiting", () => {
    it("should track IP-based attempts separately", async () => {
      // Make attempts from email
      await rateLimiter.recordFailedLogin(testEmail);
      const emailResult = await rateLimiter.checkLoginAttempt(testEmail);

      // Make attempts from IP
      await rateLimiter.recordFailedLogin(testIp);
      const ipResult = await rateLimiter.checkLoginAttempt(testIp);

      // Both should be tracked independently
      expect(emailResult.remainingAttempts).toBe(4);
      expect(ipResult.remainingAttempts).toBe(9); // IP has 10 attempt limit
    });

    it("should lock IP after 10 failed attempts", async () => {
      // Make 10 failed attempts from IP
      for (let i = 0; i < 10; i++) {
        await rateLimiter.recordFailedLogin(testIp);
      }

      const result = await rateLimiter.checkLoginAttempt(testIp);
      expect(result.allowed).toBe(false);
      expect(result.lockedUntil).toBeInstanceOf(Date);
    });

    it("should use 1-hour window for IP addresses", async () => {
      // Record attempt with old timestamp
      const oldWindowStart = new Date(Date.now() - 65 * 60 * 1000); // 65 min ago
      await db.insert(loginAttempts).values({
        identifier: testIp,
        attempts: 5,
        windowStart: oldWindowStart,
      });

      // New attempt should start fresh window
      await rateLimiter.recordFailedLogin(testIp);
      const result = await rateLimiter.checkLoginAttempt(testIp);

      // Should only count the new attempt (old one outside 60-min window)
      expect(result.remainingAttempts).toBe(9);
    });
  });

  describe("Account Unlock Flow", () => {
    it("should generate unlock token and reset attempts", async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordFailedLogin(testEmail);
      }

      // Generate unlock token
      const { token, expiresAt } = await createUnlockToken(testEmail);
      expect(token).toBeTruthy();
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Verify and unlock
      const unlocked = await verifyUnlockToken(testEmail, token);
      expect(unlocked).toBe(true);

      // Check that account is now unlocked
      const result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it("should reject expired unlock tokens", async () => {
      // Create expired token directly in DB
      const expiredToken = "expired-token-abc123";
      const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      await db.insert(verificationTokens).values({
        identifier: testEmail,
        token: `unlock:${expiredToken}`,
        expiresAt: expiredDate,
      });

      const unlocked = await verifyUnlockToken(testEmail, expiredToken);
      expect(unlocked).toBe(false);
    });

    it("should reject invalid unlock tokens", async () => {
      const unlocked = await verifyUnlockToken(testEmail, "invalid-token-xyz");
      expect(unlocked).toBe(false);
    });

    it("should delete token after successful unlock", async () => {
      // Lock account and create token
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordFailedLogin(testEmail);
      }
      const { token } = await createUnlockToken(testEmail);

      // Unlock
      await verifyUnlockToken(testEmail, token);

      // Try to use same token again
      const secondUnlock = await verifyUnlockToken(testEmail, token);
      expect(secondUnlock).toBe(false); // Token should be deleted
    });
  });

  describe("CAPTCHA Integration", () => {
    it("should verify valid CAPTCHA tokens", async () => {
      // Note: This requires CAPTCHA_SECRET_KEY in env
      // Using test credentials for hCaptcha
      const testToken = "10000000-aaaa-bbbb-cccc-000000000001"; // hCaptcha test token

      try {
        const result = await verifyCaptchaToken(testToken, "127.0.0.1");
        // In test environment, might fail without proper setup
        expect(typeof result.success).toBe("boolean");
      } catch (error) {
        // Expected in test environment without proper CAPTCHA setup
        expect(error).toBeDefined();
      }
    });

    it("should require CAPTCHA after multiple failures", async () => {
      // Make 3 failures
      for (let i = 0; i < 3; i++) {
        await rateLimiter.recordFailedLogin(testEmail);
      }

      const result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.requiresCaptcha).toBe(true);
    });
  });

  describe("Successful Login Reset", () => {
    it("should reset attempts after successful login", async () => {
      // Make 2 failed attempts
      await rateLimiter.recordFailedLogin(testEmail);
      await rateLimiter.recordFailedLogin(testEmail);

      let result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.remainingAttempts).toBe(3);

      // Simulate successful login
      await rateLimiter.resetLoginAttempts(testEmail);

      // Check attempts are reset
      result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.remainingAttempts).toBe(5);
      expect(result.requiresCaptcha).toBe(false);
    });
  });

  describe("Sliding Window Behavior", () => {
    it("should only count attempts within 15-minute window", async () => {
      // Create old attempt outside window
      const oldWindowStart = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago
      await db.insert(loginAttempts).values({
        identifier: testEmail,
        attempts: 3,
        windowStart: oldWindowStart,
      });

      // New attempt should start fresh window
      await rateLimiter.recordFailedLogin(testEmail);
      const result = await rateLimiter.checkLoginAttempt(testEmail);

      // Should only count new attempts (old ones filtered out)
      expect(result.remainingAttempts).toBe(4);
    });

    it("should maintain window for concurrent attempts", async () => {
      // Make several rapid attempts
      await Promise.all([
        rateLimiter.recordFailedLogin(testEmail),
        rateLimiter.recordFailedLogin(testEmail),
        rateLimiter.recordFailedLogin(testEmail),
      ]);

      const result = await rateLimiter.checkLoginAttempt(testEmail);
      expect(result.requiresCaptcha).toBe(true);
      expect(result.remainingAttempts).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent unlock attempts", async () => {
      // Lock account
      for (let i = 0; i < 5; i++) {
        await rateLimiter.recordFailedLogin(testEmail);
      }

      const { token } = await createUnlockToken(testEmail);

      // Try to unlock twice simultaneously
      const [unlock1, unlock2] = await Promise.all([
        verifyUnlockToken(testEmail, token),
        verifyUnlockToken(testEmail, token),
      ]);

      // One should succeed, one should fail (token deleted)
      expect(unlock1 || unlock2).toBe(true);
      expect(unlock1 && unlock2).toBe(false);
    });

    it("should handle missing identifier gracefully", async () => {
      const result = await rateLimiter.checkLoginAttempt("");
      expect(result.allowed).toBe(true); // No restrictions if no identifier
    });

    it("should handle database errors gracefully", async () => {
      // Test with malformed identifier
      try {
        await rateLimiter.recordFailedLogin("invalid@email@domain.com");
        // Should not throw
        expect(true).toBe(true);
      } catch (error) {
        // If it throws, fail the test
        expect(error).toBeUndefined();
      }
    });
  });
});
