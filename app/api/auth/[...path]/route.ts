import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { checkLoginEligibility, recordFailedLoginAttempt, resetLoginAttempts } from "@/lib/server/auth/rate-limit"
import { verifyCaptchaToken } from "@/lib/server/auth/captcha"
const RATE_LIMIT_EMAIL_LOCKOUT_THRESHOLD = 5

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

	const eligibility = await checkLoginEligibility({ email, ipAddress })

	if (!eligibility.allowed) {
		const response = NextResponse.json(
			{
				error: "Too many failed login attempts. Please try again later.",
				requiresCaptcha: eligibility.requiresCaptcha,
			},
			{ status: 429 }
		)

		if (eligibility.retryAfterSeconds) {
			response.headers.set("Retry-After", String(eligibility.retryAfterSeconds))
		}

		return response
	}

	if (eligibility.requiresCaptcha) {
		if (!captchaToken) {
			return NextResponse.json(
				{
					error: "CAPTCHA required",
					requiresCaptcha: true,
				},
				{ status: 403 }
			)
		}

		const verification = await verifyCaptchaToken({ token: captchaToken, remoteIp: ipAddress })

		if (!verification.success) {
			return NextResponse.json(
				{
					error: verification.error ?? "CAPTCHA verification failed",
					requiresCaptcha: true,
				},
				{ status: 403 }
			)
		}
	}

	const response = await authPOST(request, context)

	// Log failed authentication attempts
	if (!response.ok) {
		const result = await recordFailedLoginAttempt({ email, ipAddress })

		// Log account lock event
		if (email && result.email?.lockedUntil) {
			await logAuthEvent({
				userId: undefined,
				action: 'account_locked',
				success: true,
				ipAddress,
				metadata: {
					email,
					lockedUntil: result.email.lockedUntil.toISOString(),
				},
			})
		} else {
			// Reset attempts on successful login
			await resetLoginAttempts({ email, ipAddress })
		}
	}

	return response
}

