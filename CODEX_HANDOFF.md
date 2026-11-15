# Development notes

- The application is a static HTML/CSS/JavaScript site in `public/`.
- Supabase owns sign in, profiles, access roles and the six planner tables.
- `vercel.json` serves `public/` as a static deployment. No framework build or package install is required.
- The app is a PWA with a web manifest, local brand icons and a static offline shell. Wedding records are not cached by the service worker.
- Use the existing illustrations for their named celebrations. Baraat has its own transparent illustration in `public/assets/baraat.webp`.
- Keep guest and payment data behind Supabase row-level security. Never add service-role credentials to public files.
