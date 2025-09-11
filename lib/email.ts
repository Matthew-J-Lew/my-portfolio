import { Resend } from "resend";

export const CONTACT_TO = process.env.CONTACT_TO ?? "";
export const CONTACT_NAME = process.env.CONTACT_NAME ?? "Portfolio";
export const SITE_NAME = process.env.SITE_NAME ?? "Portfolio";

// default sender that works without a custom domain
export const MAIL_FROM =
  process.env.MAIL_FROM ?? "Matthew Lew <onboarding@resend.dev>";

// feature flag: keep autoresponder off unless explicitly enabled
export const ALLOW_AUTOREPLY =
  (process.env.RESEND_ALLOW_AUTOREPLY ?? "false").toLowerCase() === "true";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}
