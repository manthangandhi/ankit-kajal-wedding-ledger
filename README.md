# Ankit & Kajal — Wedding Ledger

A shared, mobile-friendly workspace for the wedding team. The site remains a static GitHub Pages app; Supabase provides accounts, the shared database and role-based access.

Planned separate site URL: <https://manthangandhi.github.io/ankit-kajal-wedding-ledger/>.

## Sections

Overview, 24 departments, tasks, events, guests and rooms, vendors, payments, issues, inventory, transport, backups, and admin-managed account access.

## Set up the database and first admin

Follow [SETUP.md](./SETUP.md). In short: create a free Supabase project, run [`supabase/schema.sql`](./supabase/schema.sql), add the project URL and public publishable key to [`supabase-config.js`](./supabase-config.js), then sign up and promote the first admin account in Supabase SQL Editor.

The site uses pending, viewer, editor and admin roles. New accounts start pending and cannot read wedding records. Viewers can read; editors can add and change wedding records; admins can also approve accounts. Row-level security enforces these roles in the database.

## Move existing wedding data

Before replacing the current site, open the existing tracker at [`legacy.html`](./legacy.html), connect it to the existing Sheet, download the Sheet’s data, then export a JSON backup. Keep that file private. After the new site is connected, sign in as an approved editor or admin and import the JSON backup in **Settings & backup**.

## Keep credentials safe

The Supabase project URL and publishable/anon key are browser values. Database row-level security protects the records. Never put a service-role key, database password, guest list, or other private wedding data in the public repository.

For the database schema, email confirmation, first-admin setup, local preview and GitHub Pages deployment, see [SETUP.md](./SETUP.md).
