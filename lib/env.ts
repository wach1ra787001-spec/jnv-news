const NAMES = [
  "SUPABASE_URL", "SUPABASE_SECRET_KEY", "RESEND_API_KEY", "RESEND_SEGMENT_ID",
  "NEWSLETTER_FROM_EMAIL", "NEWSLETTER_SITE_URL", "NEWSLETTER_TOKEN_SECRET",
] as const;

/** Server-only. Throws if a variable is missing so misconfiguration fails loudly. */
export function env(name: (typeof NAMES)[number]): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const siteUrl = () => env("NEWSLETTER_SITE_URL").replace(/\/+$/, "");
