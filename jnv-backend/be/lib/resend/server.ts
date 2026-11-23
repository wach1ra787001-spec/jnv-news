import { Resend } from "resend";
import { env } from "@/lib/env";

const API = "https://api.resend.com";
let resend: Resend | null = null;
const client = () => (resend ??= new Resend(env("RESEND_API_KEY")));

export async function sendEmail(o: {
  to: string; subject: string; html: string; text: string; headers?: Record<string, string>;
}) {
  const { error } = await client().emails.send({
    from: env("NEWSLETTER_FROM_EMAIL"), to: o.to, subject: o.subject,
    html: o.html, text: o.text, headers: o.headers,
  });
  if (error) throw new Error(`Resend email failed: ${error.name}`);
}

async function call(method: string, path: string, body?: unknown) {
  return fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const enc = encodeURIComponent;

/** Create the contact in the segment; if it already exists, resubscribe it and add it to the segment. */
export async function syncConfirmedContact(email: string) {
  const segmentId = env("RESEND_SEGMENT_ID");
  const created = await call("POST", "/contacts", {
    email, unsubscribed: false, segments: [{ id: segmentId }],
  });
  if (created.ok) return;

  // Most likely the contact already exists: set unsubscribed:false, then add to segment.
  const patched = await call("PATCH", `/contacts/${enc(email)}`, { unsubscribed: false });
  if (!patched.ok) throw new Error(`Resend contact create/update failed (${created.status}/${patched.status})`);
  const added = await call("POST", `/contacts/${enc(email)}/segments/${segmentId}`);
  if (!added.ok) throw new Error(`Resend add-to-segment failed (${added.status})`);
}

/** Mark unsubscribed and remove from the segment. A missing contact (404) counts as done. */
export async function syncUnsubscribedContact(email: string) {
  const segmentId = env("RESEND_SEGMENT_ID");
  const patched = await call("PATCH", `/contacts/${enc(email)}`, { unsubscribed: true });
  if (patched.status === 404) return;
  if (!patched.ok) throw new Error(`Resend unsubscribe failed (${patched.status})`);
  const removed = await call("DELETE", `/contacts/${enc(email)}/segments/${segmentId}`);
  if (!removed.ok && removed.status !== 404) throw new Error(`Resend segment removal failed (${removed.status})`);
}
