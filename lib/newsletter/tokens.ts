import { createHmac, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/** 256-bit random token, URL-safe (43 chars). Only its HMAC is stored. */
export const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (t: string) =>
  createHmac("sha256", env("NEWSLETTER_TOKEN_SECRET")).update(t).digest("hex");
export const isTokenShape = (t: unknown): t is string =>
  typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);
