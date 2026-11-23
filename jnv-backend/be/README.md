Merge into the existing project (paths relative to project root, or src/ if you use it):
lib/env.ts, lib/supabase/admin.ts, lib/resend/server.ts, lib/newsletter/{tokens,email-templates}.ts,
app/api/subscribe/route.ts, app/api/newsletter/{confirm,unsubscribe}/route.ts,
components/SubscribeForm.tsx (replaces the previous version). Copy .env.example to .env.local and fill it in.
