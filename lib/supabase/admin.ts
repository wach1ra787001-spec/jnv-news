
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | null = null;

export function supabaseAdmin(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(
      env("SUPABASE_URL"),
      env("SUPABASE_SECRET_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return client;
}

export type Subscriber =
  Database["public"]["Tables"]["newsletter_subscribers"]["Row"];

export const SUBSCRIBER_COLS =
  "id,email,status,consented_at,confirmation_token_expires_at";
