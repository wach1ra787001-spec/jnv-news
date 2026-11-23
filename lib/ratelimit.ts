import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

// Created once per server instance, outside any route handler, on first use.
let limiter: Ratelimit | null = null;
function getLimiter() {
  limiter ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(8, "10 m"),
    prefix: "jnv-weekly:subscribe",
    analytics: false,
  });
  return limiter;
}

/**
 * Client IP as supplied by the hosting platform's proxy, not by the visitor.
 * - Vercel sets x-vercel-forwarded-for / x-real-ip itself and overwrites client values.
 * - Otherwise use the LAST x-forwarded-for entry (appended by the nearest trusted proxy).
 *   The first entry is client-controlled and is deliberately ignored.
 * Adjust this to your host if it is not Vercel.
 */
export function clientIp(request: Request): string {
  const h = request.headers;
  const platform = h.get("x-vercel-forwarded-for") ?? h.get("x-real-ip");
  if (platform) return platform.split(",")[0].trim();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",").pop()!.trim();
  return "unknown";
}

/** Keyed hash so the raw IP is never stored in Redis. */
const idFor = (ip: string) => createHmac("sha256", env("NEWSLETTER_TOKEN_SECRET")).update(ip).digest("hex");

export type LimitResult = "ok" | "limited" | "unavailable";

export async function checkSubscribeLimit(request: Request): Promise<LimitResult> {
  try {
    const r = await getLimiter().limit(idFor(clientIp(request)));
    // The library "fails open" on timeout (success:true, reason:"timeout"). Treat that as unavailable.
    if ((r as { reason?: string }).reason === "timeout") return "unavailable";
    return r.success ? "ok" : "limited";
  } catch (err) {
    console.error("[ratelimit] unavailable:", err instanceof Error ? err.message : "unknown");
    return "unavailable";
  }
}
