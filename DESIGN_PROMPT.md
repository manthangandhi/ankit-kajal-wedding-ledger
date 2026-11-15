# Codex prompt: redesign Ankit & Kajal’s wedding planner

Copy the prompt below into a new Codex task when you are ready to redesign and rebuild the app.

---

## Prompt

Act as a senior product designer and frontend engineer who understands how a family wedding planner works. Redesign the Ankit & Kajal Wedding Desk as a warm, distinctive, practical Indian wedding-planning workspace. The current site feels bland and template-like. Start by understanding the actual planning work and make the interface feel considered, personal and easy to use.

### First, understand the planner’s work

The app is for the couple and the family members coordinating the wedding. It is an operations workspace, not a public invitation site and not a generic SaaS dashboard.

Think through four real moments:

1. **Getting organized:** confirm dates and venues, assign department leads, and add the first tasks.
2. **Weekly planning:** see what is due soon, overdue, blocked or missing an owner; coordinate with vendors and family leads.
3. **Guest coordination:** track RSVP, party size, contact, accommodation and arrival details without exposing them to unapproved people.
4. **Event day:** use a phone-friendly run sheet with time, next cue, venue, captain and contact details. Put urgent items first and keep long-term planning out of the way.

Design for a coordinator who may be busy, using a phone, and switching between family conversations and the app. Every page should answer: **What needs attention? Who owns it? What do I do next?**

### Product scope and navigation

Keep the day-to-day product focused on these six sections, each backed by its own Supabase table:

- **Overview:** next seven days, overdue and blocked tasks, unassigned department leads, upcoming events, and quick actions.
- **Tasks:** title, department, owner, deadline, priority, status and notes. Support search and filters for owner, department, status and due date.
- **Events:** date, venue, captain, status and a clear run-of-show view. Only show a countdown when a real date is present.
- **Guests:** name, family side, RSVP, party size, room, arrival, transport and notes. Make this information available only to approved accounts.
- **Team:** the 24 departments, their lead and backup contacts, phone numbers and assignment status.
- **Money:** one simple section with two views, Vendors and Payments. Show contract amount, paid amount, remaining balance and due date accurately.

Keep account approval and backup/import in Settings. Put Admin access where admins can find it without taking over the main navigation. On desktop use a compact, labeled left rail. On mobile use a bottom bar for Overview, Tasks, Events, Guests and More; put Team, Money, Settings and Admin inside More.

Do not add a module just because it sounds useful. Issues can be a `Blocked` task. Inventory and transport are optional; leave them out of the main workflow. Preserve exported backups until the family confirms that all needed records have been imported. Never delete a database table or row just to make the product look simpler.

### Visual direction

Create an **editorial Indian wedding planner**: part printed wedding programme, part well-organized family notebook. It should feel rooted, celebratory and calm while keeping the work easy to scan.

Use this as a starting palette, not a rule to paint every element:

- Warm paper `#F5F1E8` for the page.
- Ink `#282721` for primary text.
- Deep madder / claret `#71333B` for the main action and selected navigation.
- Marigold `#C28B3E` for small accents and dates.
- Muted leaf `#71806A` for success and completion.
- Soft stone `#DCD5C8` for rules and field borders.

Use one expressive editorial serif for event names and page headings, such as Newsreader or Instrument Serif, paired with a readable, restrained sans serif such as Manrope or Public Sans for tables, buttons and forms. Keep body copy comfortable at normal phone sizes. Use the existing Ankit & Kajal illustrations as occasional, purposeful accents; do not let artwork push useful content below the fold. A small hand-drawn rule or subtle textile-inspired detail is enough. Do not add decorative motifs to every card.

Build hierarchy with typography, spacing, alignment and fine rules. Prefer useful lists, tables and timelines to rows of identical statistic cards. Use square or lightly rounded corners, quiet borders and limited shadows.

**Avoid:** purple or multicolor gradients, glassmorphism, floating pill navigation, emoji icons, oversized decorative hero panels, excessive rounded cards, tiny uppercase labels everywhere, meaningless KPI tiles, fake dates or totals, stock wedding photos, and any generic AI-generated dashboard look.

### Interaction rules

- Start with real work, not vanity metrics. Put due soon, overdue, blocked and unassigned items before decorative content.
- Show missing information as “Not set” or “Date to confirm.” Do not imply that a blank budget is ₹0 or that an unassigned team is complete.
- Use clear statuses: Planning, Confirmed, In progress, Blocked, Completed; RSVP statuses: Pending, Confirmed, Declined; department status: Unassigned, Assigned, Confirmed.
- Put the most useful fields in the list row so the coordinator does not have to open every record to find the owner, due date, phone number or payment state.
- Add and edit in short, grouped forms with inline validation, sensible defaults and plain-language errors. Confirm destructive deletes. After saving, show a clear saved state and update the shared view.
- Keep search and filtering visible in long lists. Preserve sort/filter context after editing a record.
- For the event-day view, prioritize the next cue, current venue, captain and tap-to-call contact. Make it work on a small phone screen with large touch targets.
- Provide useful first-run states that tell the admin the next action: set event dates, assign team leads, then create tasks. Never insert fake wedding data to make a screen look populated.

### Accounts and privacy

Supabase email auto-confirm is already enabled, so do not require an inbox confirmation step. A new account still starts as `pending`; it must not read any wedding records until an admin approves it.

- **Viewer:** read-only access to approved workspace sections.
- **Editor:** create, update and delete wedding records.
- **Admin:** editor access plus account approval and role management.

Keep the role checks in Supabase row-level security, not only in the interface. Do not expose a service-role key, database password or guest information in public source code. Do not make the database public to avoid a login step.

### Database and migration rules

Use separate, understandable tables for the six active areas: `departments`, `tasks`, `events`, `guests`, `vendors` and `payments`, plus `profiles` for roles. Keep columns meaningful and preserve existing record IDs during imports. Add a foreign key only when the app actually uses and validates that relationship.

The connected Supabase project also has legacy optional tables (`issues`, `inventory`, `transport`) and an older `wedding_records` table. Do not assume they are empty. Use the safe cleanup script only after making a private backup; drop optional tables only when their row count is zero. Never drop a populated catch-all or legacy table until its records have been exported and accounted for.

The app imports the six core sections and warns if a backup contains optional records. Preserve private exports until the family confirms that the planner has all needed information.

### Build and review process

1. Inspect the current repository, live app, Supabase schema and existing records before changing them. Summarize the current state and planned design in a short checklist.
2. Produce a page-by-page layout and interaction plan before implementing. Keep the six-section scope unless the repository gives a concrete reason to change it.
3. Implement the responsive interface using the existing static app structure. The deployable site belongs in `public/`; keep SQL, setup notes and migration tooling outside the deployed output.
4. Keep GitHub Pages working. The repo has a Vercel static config that publishes `public/`; do not switch hosting until the Vercel deployment and Supabase redirects have been checked.
5. Preview desktop and phone widths. Check sign-up, pending access, admin approval, viewer read-only access, CRUD in all six sections, search, import/export, and that changes appear for a second signed-in user.
6. Verify that guests and payments remain behind approved sign-in, no private values are added to Git, no fake totals/dates appear, and original backups remain intact.
7. Report what changed, what was actually checked, what remains blocked by owner access, and the exact next action. Do not say a database, migration or deployment is complete unless it was actually run and verified.

### Design references to study, not copy

- [Joy](https://withjoy.com/) and [Zola’s planning tools](https://www.zola.com/wedding-planning): use as wedding-specific references for approachable setup and guest-planning language.
- [Partiful](https://partiful.com/): use as a reference for mobile-first event details and low-friction RSVP flows.
- [Linear](https://linear.app/): use as a reference for readable task status, ownership and dense operational lists.

Borrow interaction principles only. The final interface must have its own Ankit & Kajal identity and must not imitate another product’s branding or layout.

---
