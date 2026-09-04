# رصد (Rasd) — Mobile App

Expo (React Native + TypeScript) app for the "رصد" construction-project-tracking
platform. Built against the schema in `../docs/rasd-supabase-migration.sql`.

## Setup

1. **Install dependencies** (already done if you're continuing from this session):
   ```bash
   npm install
   ```

2. **Configure Supabase**: copy `.env.example` to `.env` and fill in your project's
   URL and anon key (Supabase Dashboard → Project Settings → API):
   ```bash
   cp .env.example .env
   ```
   `.env` is git-ignored — never commit real keys.

3. **Run the SQL migration** on your Supabase project: open the SQL Editor in the
   Supabase Dashboard, paste the contents of `../docs/rasd-supabase-migration.sql`,
   and run it. This creates all tables, RLS policies, and the
   `site-notes-photos` storage bucket.

4. **Start the app**:
   ```bash
   npx expo start
   ```
   Scan the QR code with the Expo Go app (iOS/Android) or press `a`/`i` for an
   emulator.

## Project structure

```
mobile/
  App.tsx                     — root: AuthProvider + nav switch (Auth vs App)
  src/
    lib/supabase.ts           — Supabase client (AsyncStorage-backed session)
    lib/photoUpload.ts        — image picker + Storage upload/signed URL
    types/database.ts         — hand-written types mirroring the SQL schema
    contexts/AuthContext.tsx  — session + profile state, sign up/in/out
    navigation/                — Auth stack, App stack
    screens/
      auth/                   — Login, SignUp (with role picker)
      ProjectsListScreen.tsx  — "مشاريعي": projects the user is a party to
      CreateProjectScreen.tsx — owner creates a project
      ProjectScreen.tsx       — resolves the user's role *in this project*
                                 and renders the matching screen below
      contractor/             — update form, history, assigned notes, RFI
      consultant/             — visits, note creation, approvals, RFI inbox
      owner/                  — dashboard, all notes, RFI
    components/                — shared UI atoms + cross-role widgets
    theme/tokens.ts            — colors/spacing ported from rasd-platform.jsx
```

## Key technical decisions

- **Role is per-project, not global.** `profiles.role` is the role chosen at
  sign-up, but what a user *sees inside a given project* is determined by
  matching their id against that project's `owner_id` / `contractor_id` /
  `consultant_id` (see `ProjectScreen.tsx`). This matches the schema and the
  "same user can be a party to many projects, differently each time" rule in
  `docs/rasd-scope-requirements.md` §1.
- **Auth**: Supabase email/password. `profiles` row is created automatically
  by the `handle_new_user` trigger in the SQL migration, reading `name`/`role`
  out of the sign-up call's `options.data`.
- **Photos are private.** The `site-notes-photos` bucket is not public; the
  app reads images via short-lived signed URLs (`getSignedPhotoUrl`), not
  public URLs, and uploads via base64 → ArrayBuffer (the reliable path for
  Supabase Storage from Expo/React Native — direct `fetch(uri).blob()`
  uploads are flaky on-device).
- **Supabase client typing**: the client is *not* parameterized with a
  generated `Database` type. A hand-written one (`src/types/database.ts`)
  is kept for reference/documentation and for casting query results
  (`as Note[]`, etc.), but plugging it into `createClient<Database>()`
  produced `never` on every insert/update — supabase-js's generic contract
  is stricter than a hand-rolled type reliably satisfies. Regenerate a real
  one later with `npx supabase gen types typescript` once the project is
  linked, if end-to-end type safety on the client becomes worth it.
- **Creating a project** (owner → pick contractor & consultant): `profiles`
  intentionally has no email column (email lives in `auth.users`, which
  isn't queryable from the client). As a v1 workaround, the owner enters the
  contractor/consultant's exact registered **name** to look them up in
  `profiles`. This only works if that person already has an account. A
  proper fix is a `security definer` RPC (e.g. `lookup_user_by_email`) added
  server-side — flagged here rather than silently shipped as "email lookup".
- **Not built yet, on purpose** (per the brief): push notifications and the
  AI assistant layer. In-app notifications write to the `notifications`
  table in the SQL schema but the app doesn't read/display them yet either —
  next step once the rest of the flows are validated with real data.

## Next steps

- Wire up the `notifications` table (bell icon / badge) — data model is
  already in the migration.
- EAS Build for a device-installable test build — ask when the screens above
  are validated against your real Supabase project.
- The AI assistant panel (Claude-backed), intentionally last per the brief.
