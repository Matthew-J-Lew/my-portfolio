import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { contactSchema } from "@/lib/validators/contact";
import {
  getResend,
  CONTACT_TO,
  SITE_NAME,
  MAIL_FROM,
  ALLOW_AUTOREPLY,
} from "@/lib/email";
import { ContactNotification } from "@/emails/ContactNotification";
import { AutoReply } from "@/emails/AutoReply";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid form data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = parsed.data;

  const resend = getResend();
  if (!resend) {
    return NextResponse.json(
      { ok: false, error: "Email service not configured" },
      { status: 503 }
    );
  }

  try {
    // 👉 render() returns Promise<string> in your setup — await it
    const ownerHtml = await render(
      ContactNotification({ name, email, subject, message, site: SITE_NAME })
    );

    await resend.emails.send({
      from: MAIL_FROM,
      to: CONTACT_TO,
      subject: subject?.trim() ? subject : `New message from ${SITE_NAME}`,
      html: ownerHtml,                 // now a string
      replyTo: email,
    });

    if (ALLOW_AUTOREPLY) {
      const visitorHtml = await render(
        AutoReply({ name, site: SITE_NAME })
      );
      await resend.emails.send({
        from: MAIL_FROM,
        to: email,
        subject: `Thanks for contacting ${SITE_NAME}`,
        html: visitorHtml,             // now a string
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[contact] send error:", err);
    const msg =
      err?.message ??
      (err?.statusCode === 403
        ? "Email blocked by provider (from address not allowed)"
        : "Email failed");
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
