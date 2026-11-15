# Wedding Planner setup

## Supabase

The static site uses Supabase for sign in, account roles and the six wedding record tables: `departments`, `tasks`, `events`, `guests`, `vendors` and `payments`.

1. Open the project's Supabase SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql).
2. Sign up with the owner's email from the app.
3. In Supabase SQL Editor, promote the owner by replacing the example email and running:

   ```sql
   update public.profiles as p
   set role = 'admin'
   from auth.users as u
   where p.id = u.id
     and lower(u.email) = lower('owner@example.com');
   ```

New signups remain pending until an admin assigns viewer, editor or admin access. Email auto-confirm is enabled in the current Supabase project.

For an existing Supabase project, run [`supabase/event_order_migration.sql`](./supabase/event_order_migration.sql) once to enable saved event rearranging. New projects get this column from `schema.sql`.

To enable the admin-only tracker reset button, run [`supabase/reset_wedding_planner.sql`](./supabase/reset_wedding_planner.sql) once in Supabase SQL Editor. The button clears the six planner tables and restores 24 departments and 7 event starters. It preserves profiles and sign-in accounts.

The project URL and publishable key are in [`public/supabase-config.js`](./public/supabase-config.js). They are browser-visible values; never add a service-role key or database password.

## Vercel project settings

`vercel.json` is ready for a static deployment from the repository root:

- Framework preset: **Other**
- Root directory: `./`
- Build command: leave blank
- Install command: leave blank
- Output directory: `public`
- Production branch: `main`

Import `manthangandhi/ankit-kajal-wedding-ledger` in Vercel. After Vercel assigns the project domain, open Supabase **Authentication → URL Configuration**. Set the Vercel domain as the Site URL and add `https://YOUR-PROJECT.vercel.app/**` under Redirect URLs. Keep the GitHub Pages URL in the allowlist while both hosts are in use.

The Vercel account is not connected to this workspace, so creating the project and adding the Supabase redirect must be done while signed in to your Vercel and Supabase dashboards. No build-time secrets are required for this static app.

## Local preview

```sh
cd public
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/>. The installable app and offline shell require HTTPS or localhost.
