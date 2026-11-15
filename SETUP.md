# Set up and host the Wedding Desk

The tracker is a static website. Supabase stores the records and signs users in. No wedding team member needs to create a Sheet or database account.

## Supabase database

The app uses six separate record tables: `tasks`, `events`, `departments`, `guests`, `vendors` and `payments`. `profiles` stores account roles. The SQL also creates starter departments and wedding events, and enables row-level security.

1. Open the project’s Supabase **SQL Editor**.
2. Run [`supabase/schema.sql`](./supabase/schema.sql).
3. If the SQL editor reports an error, stop and share the error before rerunning or changing policies.

The old generic `wedding_records` table is not used or dropped by this SQL. Keep it until you verify the migration and confirm it contains no needed data.

## Account access

Email auto-confirm is already enabled in the connected Supabase project, so sign-up should not require inbox confirmation. New accounts still begin as `pending`; an admin must approve them before they can see wedding data.

To create the first admin:

1. Open the site and sign up with the owner’s email.
2. In Supabase SQL Editor, replace the example address and run:

   ```sql
   update public.profiles as p
   set role = 'admin'
   from auth.users as u
   where p.id = u.id
     and lower(u.email) = lower('owner@example.com');
   ```

3. Sign in again. Under **People & access**, the admin can grant `viewer`, `editor` or `admin` access.

Viewers can read. Editors can create, change and delete wedding records. Admins can also manage account roles. Row-level security enforces these permissions in Supabase.

## Website configuration

The project URL and publishable key are stored in [`public/supabase-config.js`](./public/supabase-config.js). They are public browser values. Never put a service-role key or database password there.

The current signup confirmation setting is already off. If that changes later, Supabase Dashboard → **Authentication → Sign In / Providers → Email** → switch off **Confirm email**. The public app key cannot change this project setting.

## Migrate the existing Sheet

1. Open [`public/legacy.html`](./public/legacy.html) on the existing site.
2. Download the latest Sheet data and export a JSON backup. Keep it private.
3. Sign into the new app as an approved editor or admin and import the JSON under **Settings & backup**.

The simple tracker imports tasks, events, departments, guests, vendors and payments. If the old backup contains issue, inventory or transport records, those remain in the original JSON and Sheet; the import will tell you how many it skips. Keep the old Sheet and backup until the new data is confirmed.

## Preview locally

```sh
cd public
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`.

## Vercel hosting

The repo has a `vercel.json` that serves only the `public/` directory. To deploy:

1. In Vercel, choose **Add New → Project** and import `manthangandhi/ankit-kajal-wedding-ledger` from GitHub.
2. Keep the project root as `./`; use the static/Other framework preset, no build command, and `public` as the output directory.
3. Deploy. Vercel will provide a `*.vercel.app` address.
4. Add the Vercel URL to Supabase **Authentication → URL Configuration → Redirect URLs**. Set it as the Site URL if Vercel becomes the main address.
5. Confirm sign-up, admin approval and a record update on Vercel before switching anyone away from GitHub Pages.

Vercel account access is not connected to this workspace, so the project import and deploy must be authorized in your Vercel account. Keep GitHub Pages live as a fallback until the Vercel URL is verified.
