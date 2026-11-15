# Ankit & Kajal — Wedding Desk

A small, shared wedding-planning workspace for Ankit and Kajal. The app is a static site; Supabase supplies sign-in, data storage and role-based access.

## What it manages

Tasks, events, departments, guests, vendors and payments. Account access and backups are kept under Settings. Optional issues, inventory and transport records are not part of the new tracker; the original Sheet and backup remain available while you decide what to do with those records.

## Setup

Use [SETUP.md](./SETUP.md). Run [`supabase/schema.sql`](./supabase/schema.sql) in Supabase, then sign up and promote the first admin. The browser project URL and publishable key are in [`public/supabase-config.js`](./public/supabase-config.js); never add the service-role key.

New accounts start pending. Viewers can read; editors can manage wedding records; admins can also approve accounts. Database row-level security enforces those roles.

## Migration

Use [`public/legacy.html`](./public/legacy.html) to export data from the existing Sheet. Keep the JSON file and original Sheet private. Import it under **Settings & backup** after the new database is ready. The simplified app imports the six active sections; any issue, inventory or transport records stay in the original backup and Sheet.

## Hosting

The GitHub Pages site remains available at <https://manthangandhi.github.io/ankit-kajal-wedding-ledger/>. The repo is also configured for Vercel; see [SETUP.md](./SETUP.md) to connect it.
