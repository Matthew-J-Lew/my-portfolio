import * as React from "react";

export function AutoReply({ name, site }: { name: string; site: string }) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", lineHeight: 1.6 }}>
      <p>Hi {name},</p>
      <p>Thanks for reaching out to {site}! I’ll get back to you within 24–48 hours.</p>
      <p>Cheers,<br/>Matthew</p>
    </div>
  );
}
