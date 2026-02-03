# Neon Email & Data Export

## Does Neon send email?

**Neon (database)** does not send email. It is a serverless Postgres provider.

**Neon Auth** (when used) handles auth flows and may send **auth-related emails** (e.g. magic links, verification) through its own systems—that is auth-only, not a general “send email” API.

For **custom emails** (e.g. “email this report to …”, notifications, receipts):

- Use a **third-party email provider** and call it from your app.
- Common options: **Resend**, **SendGrid**, **AWS SES**, **Postmark**, etc.
- Implement an API route (e.g. `POST /api/v1/send-report`) that:
  1. Validates the request (auth, rate limit).
  2. Builds the report (e.g. from session summary, activity log).
  3. Calls the provider’s API to send the email.

So: **Neon does not support general “send email”; use a dedicated email service.**

---

## Data export (enterprise-style)

For **user-triggered export** (e.g. session summary, audit snapshot):

- **Client-side download** is the usual approach: user clicks “Export”, browser downloads a file. No server round-trip for the file itself.
- Implemented in this project:
  - **`lib/client/export-to-file.ts`**
    - `exportToJson(data, filename)` – download as JSON.
    - `exportToMarkdown(content, filename)` – download as Markdown (.md).
  - Used on the **sign-out page**: “Export summary (JSON)” and “Export summary (Markdown)”.
- **Formats:**
  - **JSON**: good for scripts, integrations, and structured data.
  - **Markdown**: good for human-readable reports and documentation.

If you later add “email report to …”, add an API route that uses one of the email providers above and sends the same summary (e.g. as HTML or Markdown in the body).
