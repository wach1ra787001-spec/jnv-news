import { Resend } from "resend";
import { env } from "@/lib/env";

const API = "https://api.resend.com";
let resend: Resend | null = null;
const client = () => (resend ??= new Resend(env("RESEND_API_KEY")));
const enc = encodeURIComponent;

export async function sendEmail(o: {
  to: string; subject: string; html: string; text: string; headers?: Record<string, string>;
}) {
  const { error } = await client().emails.send({
    from: env("NEWSLETTER_FROM_EMAIL"), to: o.to, subject: o.subject,
    html: o.html, text: o.text, headers: o.headers,
  });
  if (error) throw new Error(`Resend email failed: ${error.name}`);
}

function call(method: string, path: string, body?: unknown) {
  return fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function fail(what: string, res: Response): Promise<never> {
  let name = "";
  try { name = (await res.json())?.name ?? ""; } catch {}
  throw new Error(`Resend ${what} failed (${res.status}${name ? " " + name : ""})`);
}

/** true = exists, false = 404. Any other non-2xx is an error, never "not found". */
async function contactExists(email: string): Promise<boolean> {
  const res = await call("GET", `/contacts/${enc(email)}`);
  if (res.ok) return true;
  if (res.status === 404) return false;
  return fail("get contact", res);
}

/** All segment ids the contact belongs to (follows pagination). */
async function segmentIds(email: string): Promise<Set<string>> {
  const ids = new Set<string>();
  let after: string | undefined;
  for (let page = 0; page < 50; page++) {
    const q = `limit=100${after ? `&after=${enc(after)}` : ""}`;
    const res = await call("GET", `/contacts/${enc(email)}/segments?${q}`);
    if (!res.ok) return fail("list contact segments", res);
    const body = (await res.json()) as { data?: { id: string }[]; has_more?: boolean };
    if (!Array.isArray(body.data)) throw new Error("Resend list contact segments returned an unexpected response");
    body.data.forEach((s) => ids.add(s.id));
    if (!body.has_more || body.data.length === 0) return ids;
    after = body.data[body.data.length - 1].id;
  }
  throw new Error("Resend contact has too many segments to list");
}

async function syncExisting(email: string, segmentId: string) {
  const patched = await call("PATCH", `/contacts/${enc(email)}`, { unsubscribed: false });
  if (!patched.ok) return fail("update contact", patched);
  if ((await segmentIds(email)).has(segmentId)) return;
  const added = await call("POST", `/contacts/${enc(email)}/segments/${segmentId}`);
  if (!added.ok) return fail("add contact to segment", added);
}

/** Ensure a confirmed contact exists, is subscribed, and is in the JnV Weekly segment. */
export async function syncConfirmedContact(email: string) {
  const segmentId = env("RESEND_SEGMENT_ID");

  if (await contactExists(email)) return syncExisting(email, segmentId);

  const created = await call("POST", `/contacts`, {
    email, unsubscribed: false, segments: [{ id: segmentId }],
  });
  if (created.ok) return;

  // Only statuses that can mean "duplicate/race" trigger a re-check. Auth errors, rate limits
  // and server errors (401/403/429/5xx) are thrown immediately. Even for 400/409/422 the
  // existing-contact path runs only if a fresh GET proves the contact now exists.
  if ([400, 409, 422].includes(created.status) && (await contactExists(email))) {
    return syncExisting(email, segmentId);
  }
  return fail("create contact", created);
}

/** Mark unsubscribed and remove from the segment. A missing contact (404) counts as done. */
export async function syncUnsubscribedContact(email: string) {
  const segmentId = env("RESEND_SEGMENT_ID");
  const patched = await call("PATCH", `/contacts/${enc(email)}`, { unsubscribed: true });
  if (patched.status === 404) return;
  if (!patched.ok) return fail("unsubscribe contact", patched);
  const removed = await call("DELETE", `/contacts/${enc(email)}/segments/${segmentId}`);
  if (!removed.ok && removed.status !== 404) return fail("remove contact from segment", removed);
}
