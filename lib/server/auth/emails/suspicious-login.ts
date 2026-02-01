import "@/lib/server/only"

import { getServerEnv } from "@/lib/env/server"
import { sendEmail } from "@/lib/server/email/service"

export async function sendSuspiciousLoginAlert(params: {
  email: string
  attempts: number
  ipAddress?: string
  unlockToken: string
  lockedUntil: Date
}): Promise<void> {
  const env = getServerEnv()
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? ""
  const unlockUrl = `${appUrl}/api/auth/unlock?email=${encodeURIComponent(params.email)}&token=${encodeURIComponent(params.unlockToken)}`

  const subject = "Suspicious login attempts detected"
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2>Suspicious login attempts detected</h2>
      <p>We detected multiple failed login attempts for your account.</p>
      <ul>
        <li><strong>Attempts:</strong> ${params.attempts}</li>
        <li><strong>IP Address:</strong> ${params.ipAddress ?? "Unknown"}</li>
        <li><strong>Locked until:</strong> ${params.lockedUntil.toISOString()}</li>
      </ul>
      <p>If this was you, you can unlock your account using the link below:</p>
      <p><a href="${unlockUrl}">Unlock my account</a></p>
      <p>If you did not attempt to log in, we recommend changing your password immediately.</p>
      <p>This link expires in 1 hour.</p>
    </div>
  `

  await sendEmail({
    to: params.email,
    subject,
    html,
  })
}
