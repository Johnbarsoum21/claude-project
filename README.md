# The Financial Hub

A money companion for 20-28 year-olds moving into independent living: a
free-spending tracker, a Claude-powered financial companion, a 30-level
habit system, and (via Tink) automatic bank-transaction import.

Built with Expo (React Native + TypeScript) and Supabase.

## Status

This is an MVP scaffold covering the spec's manual-tracking-first MVP path:

- [x] Onboarding (income, fixed costs, savings goal, BNPL, free-spending reveal)
- [x] Home dashboard (free spending hero card, daily question, quests/levels, manual expense logging)
- [x] 30-level / 3-world progression system
- [x] Daily question bank, seeded per world
- [x] "Ask Anything" AI chat (Claude API, server-side)
- [x] Weekly insight generator (Claude API, server-side, run on a schedule)
- [x] Tink bank-connection flow (OAuth code exchange done server-side; the
      client secret never ships in the app)
- [ ] Monthly Rewind screen
- [ ] Savings goal visualization (PS5-style progress)
- [ ] Savings Buddy / Group Challenges / Level Leaderboard (needs a friends
      graph -- intentionally left as a stub in `SocialScreen`, not faked)
- [ ] Push notifications / smart nudges
- [ ] Premium paywall gating

## Project layout

```
App.tsx                   App entry: fonts, navigation root
app.config.ts             Expo config; reads env vars into `extra`
src/
  config/env.ts            Client-safe config reader (no secrets)
  theme/theme.ts            Design tokens (colors, type, categories, worlds)
  data/levels.ts            30-level / 3-world point curve
  data/videos.ts            Educational video metadata + recommender
  lib/supabase.ts           Supabase client
  lib/freeSpending.ts        Free-spending calculation
  lib/tinkLink.ts            Client-side Tink Link OAuth flow
  store/useAppStore.ts        Zustand store: auth, profile, expenses
  navigation/                Root / onboarding / tab navigators
  screens/                   Onboarding, Home, AI chat, Social, Learn
  components/                 Free-spending card, level card, daily
                               question card, add-expense sheet
supabase/
  migrations/                 SQL schema + RLS policies + seed questions
  functions/
    tink-exchange/            OAuth code -> tokens (TINK_CLIENT_SECRET lives here only)
    tink-sync/                 Pulls new transactions into `expenses`
    ai-chat/                   "Ask Anything" (ANTHROPIC_API_KEY lives here only)
    weekly-insight/            Monday insight generator
```

## Why Tink's client secret is never in the app

The Tink **client secret** is never placed in `app.config.ts`, `.env`, or
anywhere that ships inside the compiled app -- a mobile bundle can always be
decompiled, so a secret inside it is not actually secret. Only the
`TINK_CLIENT_ID` (safe to ship) goes to the client. The OAuth
authorization-code exchange, which requires the secret, happens in the
`tink-exchange` Supabase Edge Function, which reads `TINK_CLIENT_SECRET`
from a server-side secret store.

If a Tink secret was ever pasted into a chat, terminal history, or a commit,
treat it as compromised and rotate it from the Tink console.

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Create a Supabase project

Via [supabase.com](https://supabase.com): New Project -> name it, set a DB
password, pick a region, create. Takes ~2 minutes to provision.

Two ways to get the schema and functions onto it -- pick whichever fits
your network access:

**A. Supabase Dashboard (no CLI, no extra network access needed)**

1. **SQL Editor** -> paste and run, in order: `supabase/migrations/0001_init.sql`,
   `0002_seed_daily_questions.sql`, `0003_tink_tokens.sql`.
2. **Edge Functions** -> New Function, for each of `tink-exchange`,
   `tink-sync`, `ai-chat`, `weekly-insight`: name it to match the folder,
   paste in that folder's `index.ts` content. Each one is self-contained
   (no imports from a shared folder) specifically so this copy-paste works.
3. **Edge Functions -> Manage secrets** (or **Project Settings -> Edge
   Functions**) -> add:
   ```
   TINK_CLIENT_ID=...
   TINK_CLIENT_SECRET=...
   SUPABASE_URL=...                 (Settings -> API -> Project URL)
   SUPABASE_ANON_KEY=...             (Settings -> API -> anon/publishable key)
   SUPABASE_SERVICE_ROLE_KEY=...      (Settings -> API -> service_role/secret key)
   ANTHROPIC_API_KEY=...
   ```

**B. Supabase CLI** (needs outbound access to `api.supabase.com`):

```
supabase link --project-ref <your-project-ref>
supabase db push
supabase secrets set TINK_CLIENT_ID=... TINK_CLIENT_SECRET=... \
  SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
  ANTHROPIC_API_KEY=...
supabase functions deploy tink-exchange
supabase functions deploy tink-sync
supabase functions deploy ai-chat
supabase functions deploy weekly-insight
```

Either way: schedule `weekly-insight` to run for each active user (a
pg_cron job calling it every Sunday night is the simplest option, via
**Database -> Cron Jobs** in the dashboard) and `tink-sync` nightly for
users with `tink_connected = true`, per the spec's "processed automatically
overnight" principle.

### 3. Configure the app's environment variables

Copy `.env.example` to `.env` (not committed) for local `expo start` usage,
**or**, for this cloud session, set the same variables in the project's
environment settings panel (cloud environment menu -> Edit) instead of
pasting them into chat:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
TINK_CLIENT_ID=
TINK_REDIRECT_URI=financialhub://tink-callback
API_BASE_URL=            # your Supabase project's Edge Functions URL
```

### 4. Run

```
npm run start      # Metro bundler + QR code for Expo Go
npm run web         # Web preview
npm run ios          # Requires macOS + Xcode
npm run android      # Requires Android SDK / emulator
```

### 5. Type-check

```
npx tsc --noEmit
```

## Notes on this environment

`npx expo install` / `npx expo start` normally ping `api.expo.dev` and
`reactnative.directory` for compatibility checks; those hosts are blocked by
this session's network policy, so plain `npm install <package>` was used
instead everywhere, and `EXPO_OFFLINE=1` is needed for `expo export` to run
here. Neither affects the app's own code or a normal developer machine.
