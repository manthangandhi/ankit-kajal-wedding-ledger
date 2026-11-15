# Ankit & Kajal — Wedding Planner

A private, mobile friendly planner for the family coordinating Ankit and Kajal's wedding. The static app lives in `public/`; Supabase handles sign in, role approvals and the wedding records.

## Sections

Overview, tasks, individually illustrated events with a reorderable run sheet, guests, team, vendors and payments. The interface is for approved wedding members; signups wait for an admin to grant access.

## Supabase

Follow [SETUP.md](./SETUP.md) to prepare the tables and approve the first admin. The browser uses the Supabase project URL and publishable key from `public/supabase-config.js`. Never put a service-role key or database password in the website.

## Deploy on Vercel

The repository is configured for a static Vercel deployment. Import `manthangandhi/ankit-kajal-wedding-ledger`, select the **Other** framework, leave the build and install commands blank, and set the output directory to `public`. Add the deployed domain to Supabase Authentication's allowed redirect URLs.
