import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, syncConfirmedContact } from "@/lib/resend/server";
import { hashToken, isTokenShape, newToken } from "@/lib/newsletter/tokens";
import { esc, pageHtml, welcomeEmail } from "@/lib/newsletter/email-templates";
import { siteUrl } from "@/lib/env";


const invalid = () =>
  pageHtml(
    "Link not valid",
    "<p>This confirmation link is invalid, expired or already used. Request a new one from the subscription form.</p>",
    400
  );

type Pending = { id: string; email: string };

/** Shared by GET and POST: the token must match a pending subscriber and not be expired. */
async function findPending(token: string, hash: string): Promise<Pending | null> {
  const { data, error } = await supabaseAdmin()
    .from("newsletter_subscribers")
    .select("id,email,confirmation_token_expires_at")
    .eq("confirmation_token_hash", hash)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;

  const sub = data as
    | { id: string; email: string; confirmation_token_expires_at: string | null }
    | null;
  if (!sub || !sub.confirmation_token_expires_at) return null;
  if (new Date(sub.confirmation_token_expires_at) < new Date()) return null;
  return { id: sub.id, email: sub.email };
}

/**
 * GET is read-only. Mail scanners that follow the link cannot activate anyone.
 * It validates the token and shows a button that POSTs back to this endpoint.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!isTokenShape(token)) return invalid();

  try {
    if (!(await findPending(token, hashToken(token)))) return invalid();
  } catch (err) {
    console.error("[confirm:GET] failed:", err instanceof Error ? err.message : "unknown");
    return pageHtml("Something went wrong", "<p>Please try the link again shortly.</p>", 500);
  }

  return pageHtml(
    "Confirm your subscription",
    `<p>Confirm that you want to receive The JnV Weekly, our free weekly newsletter.</p>
     <form method="post" action="/api/newsletter/confirm">
       <input type="hidden" name="token" value="${esc(token)}">
       <button type="submit" style="margin-top:8px;background:#2674D9;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-size:1rem;cursor:pointer">Confirm my subscription</button>
     </form>`
  );
}

/** POST repeats every check, then syncs Resend, activates in Supabase and sends the welcome email. */
export async function POST(request: Request) {
  let token: string | null = null;
  try {
    token = String((await request.formData()).get("token") ?? "");
  } catch {
    return invalid();
  }
  if (!isTokenShape(token)) return invalid();

  try {
    const db = supabaseAdmin();
    const hash = hashToken(token);

    const sub = await findPending(token, hash);
    if (!sub) return invalid();

    // 1. Sync the confirmed contact to the Resend segment. Nothing is activated if this fails.
    await syncConfirmedContact(sub.email);

    // 2. Activate. The update only matches if the subscriber is still pending with this
    //    same token hash, so a link can be used once even if two requests race.
    const unsubToken = newToken();
    const { data: updated, error } = await db
      .from("newsletter_subscribers")
      .update({
        status: "active",
        confirmed_at: new Date().toISOString(),
        confirmation_token_hash: null,
        confirmation_token_expires_at: null,
        unsubscribe_token_hash: hashToken(unsubToken),
        unsubscribed_at: null,
      })
      .eq("id", sub.id)
      .eq("status", "pending")
      .eq("confirmation_token_hash", hash)
      .select("id");
    if (error) throw error;
    if (!updated?.length) return invalid();

    // 3. Welcome email. The subscription is already confirmed, so a failure is logged, not shown.
    try {
      const link = `${siteUrl()}/api/newsletter/unsubscribe?token=${unsubToken}`;
      await sendEmail({
        to: sub.email,
        ...welcomeEmail(link),
        headers: {
          "List-Unsubscribe": `<${link}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
    } catch (e) {
      console.error("[confirm] welcome email failed:", e instanceof Error ? e.message : "unknown");
    }

    return pageHtml(
      "Subscription confirmed",
      "<p>You're subscribed to The JnV Weekly. A welcome email is on its way.</p>"
    );
  } catch (err) {
    console.error("[confirm:POST] failed:", err instanceof Error ? err.message : "unknown");
    return pageHtml(
      "Something went wrong",
      "<p>We couldn't confirm your subscription. Your link is still valid, so please try again shortly.</p>",
      500
    );
  }
}