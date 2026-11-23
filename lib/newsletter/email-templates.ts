export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const shell = (title: string, body: string, footer: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f3f6fd;font-family:'Segoe UI',Arial,sans-serif;color:#1a2b4c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #e1e5ee;border-radius:8px">
<tr><td style="padding:28px 28px 0;font-size:20px;font-weight:600">JnV Weekly</td></tr>
<tr><td style="padding:16px 28px 28px;font-size:16px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e1e5ee;font-size:12px;line-height:1.5;color:#5a6b85">${footer}</td></tr>
</table></td></tr></table></body></html>`;

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#2674D9;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;display:inline-block;font-weight:600">${esc(label)}</a></p>`;

export function confirmationEmail(url: string) {
  return {
    subject: "Confirm your subscription to The JnV Weekly",
    html: shell("Confirm your subscription",
      `<p>Someone requested a free subscription to The JnV Weekly using this email address.</p>
       <p>Your subscription is <strong>not active until you confirm it</strong>. The link expires in 24 hours.</p>
       ${button(url, "Confirm my subscription")}
       <p style="font-size:14px;color:#5a6b85">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all">${esc(url)}</span></p>`,
      "If you didn't request this, ignore this email and you won't be subscribed."),
    text: `Someone requested a free subscription to The JnV Weekly using this email address.\n\nYour subscription is not active until you confirm it (link valid for 24 hours):\n${url}\n\nIf you didn't request this, ignore this email.`,
  };
}

export function welcomeEmail(unsubscribeUrl: string) {
  const app = "https://app.jnvtradingjournal.com";
  return {
    subject: "Welcome to The JnV Weekly",
    html: shell("Welcome to The JnV Weekly",
      `<p>Thank you for confirming your subscription.</p>
       <p>You'll receive weekly market updates, upcoming economic events and trading insights from JnV Trading Journal.</p>
       <p>Already trade with us? <a href="${app}" style="color:#2674D9">Continue to your trading dashboard</a>.</p>`,
      `Market information is provided for educational and informational purposes only and is not financial advice.<br>
       <a href="${esc(unsubscribeUrl)}" style="color:#5a6b85">Unsubscribe</a>`),
    text: `Thank you for confirming your subscription.\n\nYou'll receive weekly market updates, upcoming economic events and trading insights.\n\nTrading dashboard: ${app}\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
}

export function pageHtml(title: string, bodyHtml: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · JnV Weekly</title></head>
<body style="margin:0;background:#f3f6fd;font-family:'Segoe UI',system-ui,Arial,sans-serif;color:#1a2b4c">
<main style="max-width:520px;margin:12vh auto;padding:28px;background:#fff;border:1px solid #e1e5ee;border-radius:12px;text-align:center;line-height:1.6">
<h1 style="font-size:1.5rem;margin:0 0 12px">${esc(title)}</h1>${bodyHtml}
<p style="margin-top:24px"><a href="/" style="color:#5a6b85">Back to JnV Weekly</a></p></main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
