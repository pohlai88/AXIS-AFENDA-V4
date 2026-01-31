import { describe, it, expect, beforeEach } from "@jest/globals"
import { NextRequest } from "next/server"
import { POST } from "@/app/api/auth/register/route"
import { POST as ResetPasswordPOST } from "@/app/api/auth/reset-password/route"
import { validatePassword, validateEmail, validateUsername, RateLimiter } from "@/lib/utils/auth"

// Mock database
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

jest.mock("@/lib/server/db", () => ({
  db: mockDb,
}))

jest.mock("@/lib/server/db/schema", () => ({
  users: {},
  passwordResetTokens: {},
  eq: jest.fn(),
  and: jest.fn(),
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}))

jest.mock("nanoid", () => ({
  nanoid: jest.fn().mockReturnValue("mockToken"),
}))

describe("Auth API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
        password: "password123",
      }

      mockDb.select.mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: "1",
            email: userData.email,
            displayName: userData.name,
            username: userData.username,
            role: "user",
            isActive: true,
          }]),
        }),
      })

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("User created successfully")
      expect(data.user.email).toBe(userData.email)
      expect(data.user.displayName).toBe(userData.name)
    })

    it("should return error for duplicate email", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
        password: "password123",
      }

      mockDb.select.mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{
            id: "1",
            email: userData.email,
          }]),
        }),
      })

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe("User with this email already exists")
    })

    it("should validate input data", async () => {
      const invalidUserData = {
        name: "",
        email: "invalid-email",
        username: "ab",
        password: "123",
      }

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify(invalidUserData),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe("Invalid input")
    })
  })

  describe("POST /api/auth/reset-password", () => {
    it("should handle forgot password request", async () => {
      const emailData = {
        email: "john@example.com",
      }

      mockDb.select.mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{
            id: "1",
            email: emailData.email,
          }]),
        }),
      })

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      })

      const request = new NextRequest("http://localhost:3000/api/auth/reset-password?action=forgot", {
        method: "POST",
        body: JSON.stringify(emailData),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = await ResetPasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain("password reset link has been sent")
    })

    it("should handle password reset with valid token", async () => {
      const resetData = {
        token: "validToken",
        password: "newPassword123",
      }

      mockDb.select.mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{
            id: "1",
            userId: "1",
            token: resetData.token,
            used: false,
            expires: new Date(Date.now() + 60000), // expires in future
          }]),
        }),
      })

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      })

      const request = new NextRequest("http://localhost:3000/api/auth/reset-password?action=reset", {
        method: "POST",
        body: JSON.stringify(resetData),
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = await ResetPasswordPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("Password reset successfully")
    })
  })
})

describe("Auth Utilities", () => {
  describe("validatePassword", () => {
    it("should validate strong password", () => {
      const result = validatePassword("StrongPass123!")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should reject weak password", () => {
      const result = validatePassword("weak")
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should require uppercase letter", () => {
      const result = validatePassword("lowercase123!")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one uppercase letter")
    })

    it("should require lowercase letter", () => {
      const result = validatePassword("UPPERCASE123!")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one lowercase letter")
    })

    it("should require number", () => {
      const result = validatePassword("NoNumbers!")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one number")
    })

    it("should require special character", () => {
      const result = validatePassword("NoSpecialChars123")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one special character")
    })
  })

  describe("validateEmail", () => {
    it("should validate correct email", () => {
      expect(validateEmail("test@example.com")).toBe(true)
      expect(validateEmail("user.name+tag@domain.co.uk")).toBe(true)
    })

    it("should reject invalid email", () => {
      expect(validateEmail("invalid")).toBe(false)
      expect(validateEmail("test@")).toBe(false)
      expect(validateEmail("@example.com")).toBe(false)
      expect(validateEmail("test@.com")).toBe(false)
    })
  })

  describe("validateUsername", () => {
    it("should validate correct username", () => {
      const result = validateUsername("validuser123")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should reject short username", () => {
      const result = validateUsername("ab")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Username must be at least 3 characters long")
    })

    it("should reject long username", () => {
      const result = validateUsername("a".repeat(51))
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Username must be less than 50 characters long")
    })

    it("should reject username with invalid characters", () => {
      const result = validateUsername("user@name")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Username can only contain letters, numbers, underscores, and hyphens")
    })

    it("should reject username starting with number", () => {
      const result = validateUsername("123user")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Username cannot start with a number")
    })
  })

  describe("RateLimiter", () => {
    let rateLimiter: RateLimiter

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 60000) // 3 attempts per minute
    })

    it("should allow attempts within limit", () => {
      expect(rateLimiter.isAllowed("user1")).toBe(true)
      expect(rateLimiter.isAllowed("user1")).toBe(true)
      expect(rateLimiter.isAllowed("user1")).toBe(true)
    })

    it("should block attempts exceeding limit", () => {
      rateLimiter.isAllowed("user1")
      rateLimiter.isAllowed("user1")
      rateLimiter.isAllowed("user1")
      
      expect(rateLimiter.isAllowed("user1")).toBe(false)
    })

    it("should reset after window expires", () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now
      
      try {
        // Set initial time
        Date.now = () => 1_000_000
        
        // Use up all attempts
        rateLimiter.isAllowed("user1")
        rateLimiter.isAllowed("user1")
        rateLimiter.isAllowed("user1")
        expect(rateLimiter.isAllowed("user1")).toBe(false)
        
        // Advance time beyond window
        Date.now = () => 1_000_000 + 61_000
        
        // Should be allowed again
        expect(rateLimiter.isAllowed("user1")).toBe(true)
      } finally {
        Date.now = originalDateNow
      }
    })

    it("should handle multiple users independently", () => {
      // User 1 uses up attempts
      rateLimiter.isAllowed("user1")
      rateLimiter.isAllowed("user1")
      rateLimiter.isAllowed("user1")
      
      // User 1 should be blocked
      expect(rateLimiter.isAllowed("user1")).toBe(false)
      
      // User 2 should still be allowed
      expect(rateLimiter.isAllowed("user2")).toBe(true)
    })

    it("should return remaining attempts", () => {
      expect(rateLimiter.getRemainingAttempts("user1")).toBe(3)
      
      rateLimiter.isAllowed("user1")
      expect(rateLimiter.getRemainingAttempts("user1")).toBe(2)
      
      rateLimiter.isAllowed("user1")
      expect(rateLimiter.getRemainingAttempts("user1")).toBe(1)
      
      rateLimiter.isAllowed("user1")
      expect(rateLimiter.getRemainingAttempts("user1")).toBe(0)
    })
  })
})
