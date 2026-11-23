import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, syncConfirmedContact } from "@/lib/resend/server";
import { hashToken, isTokenShape, newToken } from "@/lib/newsletter/tokens";
import { pageHtml, welcomeEmail } from "@/lib/newsletter/email-templates";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const invalid = () =>
  pageHtml("Link not valid", "<p>This confirmation link is invalid, expired or already used. Request a new one from the subscription form.</p>", 400);

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!isTokenShape(token)) return invalid();

  try {
    const db = supabaseAdmin();
    const hash = hashToken(token);
    const { data } = await db.from("newsletter_subscribers")
      .select("id,email,confirmation_token_expires_at")
      .eq("confirmation_token_hash", hash).eq("status", "pending").maybeSingle();
    const sub = data as { id: string; email: string; confirmation_token_expires_at: string | null } | null;
    if (!sub || !sub.confirmation_token_expires_at || new Date(sub.confirmation_token_expires_at) < new Date()) return invalid();

    // 1. Resend first; activate in Supabase only if it succeeded.
    await syncConfirmedContact(sub.email);

    // 2. Activate. Conditional on the same token so a link can't be used twice.
    const unsubToken = newToken();
    const { data: updated, error } = await db.from("newsletter_subscribers").update({
      status: "active",
      confirmed_at: new Date().toISOString(),
      confirmation_token_hash: null,
      confirmation_token_expires_at: null,
      unsubscribe_token_hash: hashToken(unsubToken),
      unsubscribed_at: null,
    }).eq("id", sub.id).eq("status", "pending").eq("confirmation_token_hash", hash).select("id");
    if (error) throw error;
    if (!updated?.length) return invalid();

    // 3. Welcome email. The subscription is already confirmed, so a failure here is logged, not shown as failure.
    try {
      const link = `${siteUrl()}/api/newsletter/unsubscribe?token=${unsubToken}`;
      await sendEmail({
        to: sub.email, ...welcomeEmail(link),
        headers: { "List-Unsubscribe": `<${link}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
    } catch (e) {
      console.error("[confirm] welcome email failed:", e instanceof Error ? e.message : "unknown");
    }
    return pageHtml("Subscription confirmed", "<p>You're subscribed to The JnV Weekly. A welcome email is on its way.</p>");
  } catch (err) {
    console.error("[confirm] failed:", err instanceof Error ? err.message : "unknown");
    return pageHtml("Something went wrong", "<p>We couldn't confirm your subscription. Your link is still valid, so please try again shortly.</p>", 500);
  }
}
