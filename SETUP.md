# Set up the shared wedding database

The site stays on GitHub Pages. Supabase supplies the database and account sign-in; nobody who joins the wedding team needs their own Sheet or database project.

## 1. Create the free database project

1. Create a Supabase account and a new project for **Ankit & Kajal Wedding Ledger**.
2. Choose a strong database password and keep it in your password manager. It is not used by the website.
3. In the Supabase dashboard, open **SQL Editor → New query**.
4. Copy all of [`supabase/schema.sql`](./supabase/schema.sql) into the editor and run it. It creates the tables, role policies, signup profile trigger, and starter departments/events.

## 2. Connect this website

1. In Supabase, open **Project Settings → API** (or **Data API** in the current dashboard).
2. Copy the **Project URL** and the **publishable key**. The legacy `anon` public key also works. Never use the `service_role` key here.
3. Put those two values into [`supabase-config.js`](./supabase-config.js):

   ```js
   window.WEDDING_SUPABASE = {
     url: "https://YOUR_PROJECT.supabase.co",
     publishableKey: "sb_publishable_..."
   };
   ```

   These are designed to be visible in the browser. The SQL row-level security rules protect the data. A service-role key or database password would bypass those rules and must never be published.

## 3. Create the first admin account

1. Publish the configured site to GitHub Pages, or preview it locally using the instructions below.
2. Use **Request access** to sign up with the email address that should own the wedding workspace. Confirm the email if Supabase asks.
3. In Supabase SQL Editor, replace the example email and run this once:

   ```sql
   update public.profiles as p
   set role = 'admin'
   from auth.users as u
   where p.id = u.id
     and lower(u.email) = lower('owner@example.com');
   ```

   Check that Supabase reports **1 row** updated. Sign in again. The first admin can approve other accounts and assign `viewer`, `editor`, or `admin` roles under **People & access**.

New sign-ups default to `pending`, which has no access to wedding records. This prevents a new account from promoting itself or reading guest information. Viewers can read; editors can manage wedding records; admins can manage both records and account access.

## 4. Configure sign-in email links

In **Authentication → URL Configuration**, set the site URL to:

```text
https://manthangandhi.github.io/ankit-kajal-wedding-ledger/
```

Add that URL and the local preview URL to the redirect allow list:

```text
https://manthangandhi.github.io/ankit-kajal-wedding-ledger/**
http://127.0.0.1:4173/**
```

For a private family workspace, leave email confirmation enabled. Supabase’s free email sending is rate-limited; a custom SMTP provider can be added if invitations exceed those limits.

## 5. Bring across the current Google Sheet data

Do this before relying on the new database as the shared source of truth:

1. Open [`legacy.html`](./legacy.html) at the same GitHub Pages path. It is the previous tracker, retained temporarily for migration.
2. In **Settings & Sync**, connect the existing Apps Script URL and PIN. Choose **Download from Sheets** so the local browser has the latest shared data.
3. Export the tracker’s JSON backup and store the file somewhere private.
4. Sign in to the new site as an approved editor or admin. In **Settings & backup**, import the JSON file.
5. Check a few departments, guests, payments and events in the new site before asking the team to use it.

The import preserves existing record IDs and updates matching records. Keep the Google Sheet and a private JSON backup until the family has confirmed the migration.

## Preview locally

From this project's root:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. The site is static; there is no build or package install. Add the local preview URL above to Supabase’s redirect list if email confirmation is enabled.

## Publish on GitHub Pages

The site has no build step. The separate repository publishes through its GitHub Actions Pages workflow at `https://manthangandhi.github.io/ankit-kajal-wedding-ledger/`. Commit `supabase-config.js` with the public project URL and publishable key after running the SQL and confirming RLS is enabled. No private server credentials belong in GitHub.

The free `github.io` address is enough to use the site. If hosting changes later, the same static app can move to a free Pages subdomain such as `pages.dev`; a custom domain name is usually a paid registration.
