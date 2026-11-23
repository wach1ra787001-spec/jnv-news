import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncUnsubscribedContact } from "@/lib/resend/server";
import { hashToken, isTokenShape } from "@/lib/newsletter/tokens";
import { esc, pageHtml } from "@/lib/newsletter/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const invalid = () => pageHtml("Link not valid", "<p>This unsubscribe link is invalid or has already been used.</p>", 400);

async function findByToken(token: string) {
  const { data } = await supabaseAdmin().from("newsletter_subscribers")
    .select("id,email,status").eq("unsubscribe_token_hash", hashToken(token)).maybeSingle();
  return data as { id: string; email: string; status: string } | null;
}

/** GET never changes state (mail scanners follow links). It only shows a confirmation form. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!isTokenShape(token)) return invalid();
  try {
    if (!(await findByToken(token))) return invalid();
  } catch { return pageHtml("Something went wrong", "<p>Please try again shortly.</p>", 500); }
  return pageHtml("Unsubscribe from The JnV Weekly",
    `<p>Confirm that you want to stop receiving The JnV Weekly.</p>
     <form method="post" action="/api/newsletter/unsubscribe"><input type="hidden" name="token" value="${esc(token)}">
     <button type="submit" style="margin-top:8px;background:#2e2e2e;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-size:1rem;cursor:pointer">Unsubscribe</button></form>`);
}

/** POST accepts the token from the form body or the query string (for one-click List-Unsubscribe). */
export async function POST(request: Request) {
  let token: string | null = new URL(request.url).searchParams.get("token");
  if (!token) {
    try { token = String((await request.formData()).get("token") ?? ""); } catch { token = null; }
  }
  if (!isTokenShape(token)) return invalid();

  try {
    const db = supabaseAdmin();
    const sub = await findByToken(token);
    if (!sub) return invalid();

    // Record locally first (token kept until Resend confirms, so a failed sync can be retried).
    if (sub.status !== "unsubscribed") {
      const { error } = await db.from("newsletter_subscribers")
        .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() }).eq("id", sub.id);
      if (error) throw error;
    }
    await syncUnsubscribedContact(sub.email);
    await db.from("newsletter_subscribers").update({ unsubscribe_token_hash: null }).eq("id", sub.id);
    return pageHtml("You've been unsubscribed", "<p>You won't receive The JnV Weekly any more. You can subscribe again at any time.</p>");
  } catch (err) {
    console.error("[unsubscribe] failed:", err instanceof Error ? err.message : "unknown");
    return pageHtml("Something went wrong", "<p>We couldn't complete your request. Please try the link again shortly.</p>", 500);
  }
}
