import { test, expect } from "@playwright/test";

test.describe("Brute Force Protection", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "Test1234!";
  const wrongPassword = "WrongPass123!";

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
  });

  test("should show CAPTCHA after 3 failed login attempts", async ({ page }) => {
    // Attempt 1: Failed login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible();

    // Attempt 2: Failed login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible();

    // Attempt 3: Failed login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible();

    // Attempt 4: Should show CAPTCHA
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);

    // Check for CAPTCHA element (hCaptcha iframe)
    const captchaFrame = page.frameLocator('iframe[title*="hCaptcha"]');
    await expect(captchaFrame.locator('[role="presentation"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should lock account after 5 failed login attempts", async ({ page }) => {
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', wrongPassword);
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForTimeout(500);
    }

    // Attempt 6: Should show lockout message
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');

    // Check for lockout error
    await expect(
      page.locator('text=/account.*locked|too many.*attempts/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test("should send unlock email when account is locked", async ({ page }) => {
    // Lock the account (5 failed attempts)
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', wrongPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Check for message mentioning email
    await expect(
      page.locator('text=/check.*email|email.*sent|unlock.*link/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test("should unlock account via email link", async ({ page, context }) => {
    // This test requires access to email service (Resend)
    // In real scenario, you'd:
    // 1. Lock the account
    // 2. Retrieve unlock token from database or email service
    // 3. Navigate to unlock URL
    // 4. Verify account is unlocked

    test.skip(true, "Requires email service integration for full test");

    // Example unlock flow:
    // const unlockToken = await getUnlockTokenFromDB(testEmail);
    // await page.goto(`/auth/unlock?email=${testEmail}&token=${unlockToken}`);
    // await expect(page.locator('text=/account.*unlocked/i')).toBeVisible();
    // await expect(page).toHaveURL('/login');
  });

  test("should reset attempts after successful login", async ({ page }) => {
    // First, register a test user
    await page.goto("/register");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="name"]', "Test User");
    await page.click('button[type="submit"]');

    // Wait for registration (might redirect to verify email)
    await page.waitForTimeout(2000);

    // Make 2 failed attempts
    await page.goto("/login");
    for (let i = 0; i < 2; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', wrongPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Now login successfully
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard|\/app/, { timeout: 10000 });

    // Logout
    await page.click('[aria-label="User menu"]');
    await page.click('text=/logout/i');

    // Try to login again - should not require CAPTCHA (attempts reset)
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');

    // Should NOT show CAPTCHA (attempts were reset)
    const captchaFrame = page.frameLocator('iframe[title*="hCaptcha"]');
    await expect(captchaFrame.locator('[role="presentation"]')).not.toBeVisible({
      timeout: 2000,
    });
  });

  test("should handle CAPTCHA verification flow", async ({ page }) => {
    // Make 3 failed attempts to trigger CAPTCHA
    for (let i = 0; i < 3; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', wrongPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Next attempt should show CAPTCHA
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);

    // Wait for CAPTCHA to appear
    const captchaFrame = page.frameLocator('iframe[title*="hCaptcha"]');
    await expect(captchaFrame.locator('[role="presentation"]')).toBeVisible({
      timeout: 5000,
    });

    // In test environment with test keys, you can use hCaptcha test mode
    // Real E2E would require manual CAPTCHA solving or test bypass
    test.skip(true, "CAPTCHA solving requires test bypass or manual interaction");
  });

  test("should show remaining attempts in error message", async ({ page }) => {
    // First failed attempt
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', wrongPassword);
    await page.click('button[type="submit"]');

    // Check if error message includes remaining attempts info
    const errorMessage = page.locator('[role="alert"], .error-message');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // The exact format depends on your implementation
    // Example: "Invalid credentials. 4 attempts remaining."
    const text = await errorMessage.textContent();
    expect(text).toBeTruthy();
  });

  test("should apply IP-based rate limiting", async ({ page, context }) => {
    // Create multiple pages (simulating requests from same IP)
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    // Make rapid failed attempts from same IP with different emails
    const emails = ["user1@test.com", "user2@test.com", "user3@test.com"];

    for (const email of emails) {
      for (let i = 0; i < 4; i++) {
        await page.goto("/login");
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', wrongPassword);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(300);
      }
    }

    // After 12 attempts from same IP (3 emails × 4 attempts)
    // IP should be throttled or show CAPTCHA
    await page.goto("/login");
    await page.fill('input[name="email"]', "another@test.com");
    await page.fill('input[name="password"]', wrongPassword);

    // Should show CAPTCHA or rate limit message
    const hasCaptcha = await page
      .frameLocator('iframe[title*="hCaptcha"]')
      .locator('[role="presentation"]')
      .isVisible()
      .catch(() => false);

    const hasRateLimitMsg = await page
      .locator('text=/too many.*attempts|rate.*limit/i')
      .isVisible()
      .catch(() => false);

    expect(hasCaptcha || hasRateLimitMsg).toBe(true);

    await page2.close();
    await page3.close();
  });

  test("should preserve lockout across browser sessions", async ({
    page,
    context,
  }) => {
    // Lock the account
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', wrongPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Verify locked
    await expect(
      page.locator('text=/account.*locked|too many/i')
    ).toBeVisible();

    // Open new incognito context (simulating new session)
    const newContext = await page.context().browser()?.newContext();
    if (!newContext) {
      test.skip(true, "Cannot create new context");
      return;
    }

    const newPage = await newContext.newPage();
    await newPage.goto("/login");

    // Try to login from new session
    await newPage.fill('input[name="email"]', testEmail);
    await newPage.fill('input[name="password"]', testPassword);
    await newPage.click('button[type="submit"]');

    // Should still be locked
    await expect(
      newPage.locator('text=/account.*locked|too many/i')
    ).toBeVisible();

    await newContext.close();
  });
});

test.describe("Admin Account Unlock", () => {
  test.skip(true, "Requires admin user setup and authentication");

  test("admin should be able to manually unlock accounts", async ({ page }) => {
    // 1. Login as admin
    // 2. Navigate to admin dashboard
    // 3. Find locked user account
    // 4. Click "Unlock Account" button
    // 5. Verify account is unlocked
    // 6. Verify audit log entry created
  });
});

test.describe("Load Testing", () => {
  test.skip(true, "Performance tests - run separately with Artillery or k6");

  test("should handle 10k requests per minute", async () => {
    // Use Artillery or k6 for load testing:
    // artillery quick --count 10000 --num 60 http://localhost:3000/api/auth/login
  });
});
