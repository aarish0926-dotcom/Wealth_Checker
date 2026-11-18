# Wealth Checker

Next.js + Supabase Auth starter for a private finance app.

## Setup
1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project in `.env.local` or Vercel environment variables.
2. Run `npm install` then `npm run dev`.
3. In Supabase Authentication → URL Configuration, configure the production site URL and allowed callback URLs, including `/auth/confirm`.
4. For token-hash email confirmation, set the email confirmation template link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.

Routes: `/login` (sign-in/signup), `/auth/confirm` (email verification), `/dashboard` (protected). All financial tables must also enforce owner-scoped RLS policies.
