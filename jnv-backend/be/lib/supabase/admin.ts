import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: ReturnType<typeof createClient> | null = null;

/** Service-role client. Import only from server code (route handlers). */
export function supabaseAdmin() {
  client ??= createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export type Subscriber = {
  id: string;
  email: string;
  status: "pending" | "active" | "unsubscribed";
  consented_at: string | null;
  confirmation_token_expires_at: string | null;
};
export const SUBSCRIBER_COLS = "id,email,status,consented_at,confirmation_token_expires_at";
