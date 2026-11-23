import { NextResponse } from "next/server";
import { supabaseAdmin, SUBSCRIBER_COLS, type Subscriber } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/server";
import { hashToken, newToken } from "@/lib/newsletter/tokens";
import { confirmationEmail } from "@/lib/newsletter/email-templates";
import { siteUrl } from "@/lib/env";


const MAX_BODY = 2048;
const COOLDOWN_MS = 2 * 60 * 1000;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Best-effort per-instance limiter. On serverless, replace with a shared store (e.g. Upstash).
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
}

const reply = (status: number, code: string, message: string) =>
  NextResponse.json({ status: code, message }, { status });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (limited(ip)) return reply(429, "rate_limited", "Too many attempts. Please try again in a few minutes.");

  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return reply(413, "too_large", "Request too large.");
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply(413, "too_large", "Request too large.");

  let body: { email?: unknown; website?: unknown };
  try { body = JSON.parse(raw); } catch { return reply(400, "bad_request", "Invalid request."); }
  if (typeof body !== "object" || body === null) return reply(400, "bad_request", "Invalid request.");

  // Honeypot: real visitors never fill this. Respond neutrally and do nothing.
  if (typeof body.website === "string" && body.website.length > 0) return reply(200, "pending", "Check your inbox to confirm.");

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email))
    return reply(400, "invalid_email", "Enter a valid email address, for example name@example.com.");

  try {
    const db = supabaseAdmin();
    const { data: found, error: findErr } = await db
      .from("newsletter_subscribers").select(SUBSCRIBER_COLS).eq("email", email).maybeSingle();
    if (findErr) throw findErr;
    const existing = found as Subscriber | null;

    if (existing?.status === "active")
      return reply(200, "already_subscribed", "This email is already subscribed to The JnV Weekly.");

    if (existing?.status === "pending" && existing.consented_at &&
        Date.now() - new Date(existing.consented_at).getTime() < COOLDOWN_MS)
      return reply(429, "cooldown", "A confirmation email was just sent. Check your inbox, or wait two minutes to request another.");

    const token = newToken();
    const now = new Date();
    const fields = {
      status: "pending",
      source: "website",
      consented_at: now.toISOString(),
      confirmed_at: null,
      confirmation_token_hash: hashToken(token),
      confirmation_token_expires_at: new Date(now.getTime() + TOKEN_TTL_MS).toISOString(),
      unsubscribe_token_hash: null,
    };

    if (existing) {
      const { error } = await db.from("newsletter_subscribers").update(fields).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("newsletter_subscribers").insert({ email, ...fields });
      if (error) {
        if (error.code === "23505") return reply(429, "cooldown", "Please try again in a moment.");
        throw error;
      }
    }

    const mail = confirmationEmail(`${siteUrl()}/api/newsletter/confirm?token=${token}`);
    await sendEmail({ to: email, ...mail });
    return reply(200, "pending", "Almost done. Check your inbox for a confirmation link.");
  } catch (err) {
    console.error("[subscribe] failed:", err instanceof Error ? err.message : "unknown error");
    return reply(500, "server_error", "We couldn't complete your subscription. Please try again shortly.");
  }
}
