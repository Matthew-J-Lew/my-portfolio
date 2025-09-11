import * as React from "react";

export function ContactNotification({
  name, email, subject, message, site,
}: {
  name: string; email: string; subject?: string; message: string; site: string;
}) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", lineHeight: 1.6 }}>
      <h2>New message from {site}</h2>
      <p><b>Name:</b> {name}</p>
      <p><b>Email:</b> {email}</p>
      {subject ? <p><b>Subject:</b> {subject}</p> : null}
      <p><b>Message:</b></p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre>
    </div>
  );
}
