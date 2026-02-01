import "@/lib/server/only"

import { getServerEnv } from "@/lib/env/server"
import { logger } from "@/lib/server/logger"

export interface CaptchaVerificationResult {
  success: boolean
  error?: string
}

const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify"

export async function verifyCaptchaToken(params: {
  token: string
  remoteIp?: string
}): Promise<CaptchaVerificationResult> {
  const env = getServerEnv()

  if (!env.CAPTCHA_PROVIDER || !env.CAPTCHA_SECRET_KEY) {
    return {
      success: false,
      error: "CAPTCHA provider is not configured",
    }
  }

  if (env.CAPTCHA_PROVIDER === "hcaptcha") {
    return verifyHcaptcha(params.token, env.CAPTCHA_SECRET_KEY, params.remoteIp)
  }

  return {
    success: false,
    error: "Unsupported CAPTCHA provider",
  }
}

async function verifyHcaptcha(token: string, secret: string, remoteIp?: string): Promise<CaptchaVerificationResult> {
  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    })

    if (remoteIp) {
      body.set("remoteip", remoteIp)
    }

    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })

    const result = (await response.json()) as { success?: boolean; [key: string]: unknown }

    if (!result.success) {
      return { success: false, error: "CAPTCHA verification failed" }
    }

    return { success: true }
  } catch (error) {
    logger.warn({ err: error }, "CAPTCHA verification failed")
    return { success: false, error: "CAPTCHA verification failed" }
  }
}
