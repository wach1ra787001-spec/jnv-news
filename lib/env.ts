const NAMES = [
  "SUPABASE_URL", "SUPABASE_SECRET_KEY", "RESEND_API_KEY", "RESEND_SEGMENT_ID",
  "NEWSLETTER_FROM_EMAIL", "NEWSLETTER_SITE_URL", "NEWSLETTER_TOKEN_SECRET",
  // Read directly by Redis.fromEnv(); listed here so they are documented with the rest.
  "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
] as const;

/** Server-only. Throws if a variable is missing so misconfiguration fails loudly. */
export function env(name: (typeof NAMES)[number]): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const siteUrl = () => env("NEWSLETTER_SITE_URL").replace(/\/+$/, "");
