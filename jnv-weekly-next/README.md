Drop these into your existing Next.js project (App Router, `@/*` alias -> project root or src/):
- app/layout.tsx, app/page.tsx, app/globals.css (keep your existing Tailwind import line), app/icon.svg (favicon)
- components/SubscribeSection.tsx, components/SubscribeForm.tsx
If your project uses src/, put app/ and components/ under src/.
Implement POST /api/subscribe (Supabase + Resend) to enable real subscriptions.
