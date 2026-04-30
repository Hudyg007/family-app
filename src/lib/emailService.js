/**
 * Family Hub — Email Service
 * Uses the EmailJS REST API to send transactional emails from the browser.
 *
 * Setup (one-time):
 *  1. Sign up free at https://emailjs.com
 *  2. Add an Email Service (Gmail, Outlook, etc.) → copy the Service ID
 *  3. Create an Email Template with these variables:
 *       {{to_email}}   — recipient address
 *       {{otp_code}}   — the 6-digit verification code
 *       Subject line:  "Your Family Hub code: {{otp_code}}"
 *     Copy the Template ID.
 *  4. Go to Account → Public Key, copy it.
 *  5. Paste all three into .env (see .env.example).
 */

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const IS_CONFIGURED = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * Sends a verification code email.
 * @param {string} toEmail - recipient email address
 * @param {string} code    - 6-digit OTP
 * @returns {Promise<{ ok: boolean, devMode?: boolean, error?: string }>}
 */
export async function sendVerificationEmail(toEmail, code) {
  // If credentials aren't set up yet, fall back gracefully to dev mode.
  if (!IS_CONFIGURED) {
    console.warn(
      "[emailService] EmailJS not configured — running in dev mode.\n" +
      `Verification code for ${toEmail}: ${code}\n` +
      "Add VITE_EMAILJS_* keys to .env to enable real email sending."
    );
    return { ok: true, devMode: true };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id:     PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          otp_code: code,
          app_name: "Family Hub",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown error");
      console.error(`[emailService] EmailJS ${res.status}:`, text);
      throw new Error(text);
    }

    return { ok: true };
  } catch (err) {
    console.error("[emailService] failed:", err.message);
    // Fall back to dev mode so you can still test the app
    return { ok: true, devMode: true };
  }
}

/** Returns true when EmailJS credentials are present in the environment. */
export const emailConfigured = IS_CONFIGURED;

/**
 * Sends a family issue/feedback report email to the account owner.
 *
 * Requires a second EmailJS template with these variables:
 *   {{to_email}}      — account owner's email
 *   {{reporter_name}} — who submitted the report
 *   {{issue_type}}    — Bug / Feedback / Feature Request / Other
 *   {{message}}       — the report body
 *   {{date}}          — submission timestamp
 *
 * Set VITE_EMAILJS_REPORT_TEMPLATE_ID in your .env to enable.
 *
 * @param {string} toEmail
 * @param {{ reporterName:string, issueType:string, message:string, date:string }} data
 * @returns {Promise<{ ok:boolean, noTemplate?:boolean }>}
 */
export async function sendIssueReport(toEmail, { reporterName, issueType, message, date }) {
  const reportTemplateId = import.meta.env.VITE_EMAILJS_REPORT_TEMPLATE_ID;

  if (!IS_CONFIGURED || !reportTemplateId) {
    console.warn("[emailService] Report template not configured — storing in-app only.");
    return { ok: false, noTemplate: true };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  SERVICE_ID,
        template_id: reportTemplateId,
        user_id:     PUBLIC_KEY,
        template_params: {
          to_email:      toEmail,
          reporter_name: reporterName,
          issue_type:    issueType,
          message,
          date,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown error");
      console.error(`[emailService] Report send failed ${res.status}:`, text);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[emailService] Report send error:", err.message);
    return { ok: false };
  }
}
