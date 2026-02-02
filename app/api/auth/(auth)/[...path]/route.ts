/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/auth/:path*
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { checkLoginEligibility, recordFailedLoginAttempt, resetLoginAttempts } from "@/lib/server/auth/rate-limit"
import { verifyCaptchaToken } from "@/lib/server/auth/captcha"
import { fail } from "@/lib/server/api/response"
import { HEADER_NAMES } from "@/lib/constants"

/**
 * Neon Auth Proxy Handler
 * 
 * Delegates authentication to Neon Auth service while adding:
 * - Rate limiting and account lockout
 * - CAPTCHA verification
 * - Audit logging
 * 
 * Neon Auth handles:
 * - User registration/login
 * - Session management
 * - Email verification
 * - Password reset
 * - OAuth flows
 */

// Extract handlers from the auth server instance
// Handles: /session, /callback, /sign-in, /sign-up, and other requests
const { GET: authGET, POST: authPOST } = auth.handler()

function isSignInRequest(request: NextRequest): boolean {
	return request.nextUrl.pathname.includes("/sign-in")
}

// GET handler - delegate all GET requests to Neon Auth (session, callback, etc.)
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ path: string[] }> }
) {
	return authGET(request, context)
}

async function extractAuthPayload(request: NextRequest): Promise<{ email?: string; captchaToken?: string }> {
	const contentType = request.headers.get("content-type") ?? ""
	const headerCaptcha = request.headers.get("x-captcha-token") ?? undefined

	try {
		if (contentType.includes("application/json")) {
			const body = await request.clone().json()
			return {
				email: typeof body?.email === "string" ? body.email : undefined,
				captchaToken:
					typeof body?.captchaToken === "string"
						? body.captchaToken
						: headerCaptcha,
			}
		}

		if (contentType.includes("application/x-www-form-urlencoded")) {
			const formData = await request.clone().formData()
			const email = formData.get("email")
			const captchaToken = formData.get("captchaToken")
			return {
				email: typeof email === "string" ? email : undefined,
				captchaToken:
					typeof captchaToken === "string"
						? captchaToken
						: headerCaptcha,
			}
		}
	} catch {
		return { captchaToken: headerCaptcha }
	}

	return {}
}

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ path: string[] }> }
) {
	if (!isSignInRequest(request)) {
		// Delegate to Neon Auth for non-sign-in requests (sign-up, password reset, etc.)
		return authPOST(request, context)
	}

	// Rate limiting and security checks for sign-in
	const { email, captchaToken } = await extractAuthPayload(request)
	const ipAddress = extractIpAddress(request.headers)
	const requestId = request.headers.get(HEADER_NAMES.REQUEST_ID) ?? undefined

	const eligibility = await checkLoginEligibility({ email, ipAddress })

	if (!eligibility.allowed) {
		return fail(
			{
				code: "TOO_MANY_ATTEMPTS",
				message: "Too many failed login attempts. Please try again later.",
				requestId,
				details: {
					requiresCaptcha: eligibility.requiresCaptcha,
					retryAfterSeconds: eligibility.retryAfterSeconds,
				},
			},
			429,
			eligibility.retryAfterSeconds
				? { headers: { "Retry-After": String(eligibility.retryAfterSeconds) } }
				: undefined
		)
	}

	if (eligibility.requiresCaptcha) {
		if (!captchaToken) {
			return fail(
				{
					code: "CAPTCHA_REQUIRED",
					message: "CAPTCHA required",
					requestId,
					details: { requiresCaptcha: true },
				},
				403
			)
		}

		const verification = await verifyCaptchaToken({ token: captchaToken, remoteIp: ipAddress })

		if (!verification.success) {
			return fail(
				{
					code: "CAPTCHA_FAILED",
					message: verification.error ?? "CAPTCHA verification failed",
					requestId,
					details: { requiresCaptcha: true },
				},
				403
			)
		}
	}

	const response = await authPOST(request, context)

	// Record failed authentication attempts (rate limit state is owned by us, not Neon Auth).
	if (!response.ok) {
		const result = await recordFailedLoginAttempt({ email, ipAddress })

		// Log account lock event (user may not be known yet; keep details in metadata).
		if (email && result.email?.lockedUntil) {
			await logAuthEvent({
				userId: undefined,
				action: "account_locked",
				success: true,
				ipAddress,
				metadata: {
					email,
					lockedUntil: result.email.lockedUntil.toISOString(),
				},
			})
		}
	} else {
		// Reset attempts on successful login.
		await resetLoginAttempts({ email, ipAddress })
	}

	return response
}

