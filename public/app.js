const RECORD_TYPES = [
  "departments", "tasks", "events", "guests", "vendors", "payments"
];
const OPTIONAL_BACKUP_TYPES = ["issues", "inventory", "transport"];

const NAV_ITEMS = [
  ["dashboard", "Overview", "⌂"],
  ["tasks", "Tasks", "✓"],
  ["events", "Events", "✦"],
  ["departments", "Departments", "♧"],
  ["guests", "Guests & rooms", "♙"],
  ["vendors", "Vendors", "▤"],
  ["payments", "Budget & payments", "₹"],
  ["users", "People & access", "◎"],
  ["settings", "Settings & backup", "⚙"]
];

const DEPARTMENTS = [
  "Invitations & RSVP", "Guest Reception", "Accommodation", "Transportation",
  "VIP & Elderly Care", "Haldi & Mehendi", "Sangeet & Entertainment",
  "Wedding Rituals", "Baraat & Procession", "Bride & Groom Readiness",
  "Venue Management", "Decoration & Florals", "Catering & Food",
  "Photography & Video", "Sound, Light & Technical", "Vendor Coordination",
  "Inventory & Gifts", "Finance & Payments", "Security & Valuables",
  "Medical & Emergency", "Parking & Traffic", "Family Coordination",
  "Communication & Announcements", "Troubleshooting & Contingency"
];

const FIELDS = {
  departments: [
    ["name", "Department", "text"], ["lead", "Primary contact", "text"],
    ["phone", "Phone", "tel"], ["backup", "Backup contact", "text"],
    ["backupPhone", "Backup phone", "tel"],
    ["status", "Status", "select", "Unassigned|Assigned|Confirmed"],
    ["notes", "Notes", "textarea"]
  ],
  tasks: [
    ["title", "Task", "text"],
    ["department", "Department", "select", DEPARTMENTS.join("|")],
    ["owner", "Owner", "text"], ["due", "Deadline", "datetime-local"],
    ["priority", "Priority", "select", "Low|Medium|High|Critical"],
    ["status", "Status", "select", "Not Started|In Progress|Blocked|Completed"],
    ["notes", "Notes", "textarea"]
  ],
  events: [
    ["name", "Event", "text"], ["date", "Date & time", "datetime-local"],
    ["venue", "Venue", "text"], ["captain", "Captain", "text"],
    ["phone", "Captain phone", "tel"],
    ["status", "Status", "select", "Planning|Confirmed|Completed"],
    ["notes", "Run of show / notes", "textarea"]
  ],
  guests: [
    ["name", "Guest name", "text"], ["phone", "Phone", "tel"],
    ["side", "Family side", "select", "Groom|Bride|Other"],
    ["rsvp", "RSVP", "select", "Pending|Confirmed|Declined"],
    ["party", "Party size", "number"], ["room", "Room / hotel", "text"],
    ["arrival", "Arrival", "datetime-local"], ["transport", "Pickup / transport", "text"],
    ["notes", "Notes", "textarea"]
  ],
  vendors: [
    ["name", "Vendor / company", "text"], ["service", "Service", "text"],
    ["contact", "Contact person", "text"], ["phone", "Phone", "tel"],
    ["amount", "Contract amount (₹)", "number"], ["paid", "Advance paid (₹)", "number"],
    ["arrival", "Reporting date & time", "datetime-local"],
    ["status", "Status", "select", "Enquiry|Booked|Confirmed|Completed"],
    ["notes", "Notes", "textarea"]
  ],
  payments: [
    ["item", "Expense", "text"], ["category", "Category", "text"],
    ["vendor", "Payee / vendor", "text"], ["amount", "Amount (₹)", "number"],
    ["paid", "Paid (₹)", "number"], ["due", "Due date", "date"],
    ["status", "Status", "select", "Pending|Partial|Paid"], ["notes", "Reference / notes", "textarea"]
  ],
};

const TABLE_COLUMNS = {
  departments: ["name", "lead", "phone", "status"],
  tasks: ["title", "department", "owner", "due", "priority", "status"],
  events: ["name", "date", "venue", "captain", "status"],
  guests: ["name", "side", "rsvp", "party", "room", "arrival"],
  vendors: ["name", "service", "contact", "phone", "amount", "status"],
  payments: ["item", "category", "vendor", "amount", "paid", "due", "status"]
};
const REQUIRED_FIELD = {
  departments: "name", tasks: "title", events: "name",
  guests: "name", vendors: "name", payments: "item"
};

const TITLES = Object.fromEntries(NAV_ITEMS.map(([id, title]) => [id, title]));
const $ = (id) => document.getElementById(id);
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
}[char]));
const listData = Object.fromEntries(RECORD_TYPES.map((type) => [type, []]));

let supabase;
let currentUser;
let currentProfile;
let currentView = "dashboard";
let activeRecordType = null;
let editingRecordId = null;
let searchTerm = "";
let toastTimer;
let loadingUserId = null;
let realtimeChannel;

function notify(message) {
  const notice = $("notice");
  notice.textContent = message;
  notice.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => notice.classList.remove("visible"), 3600);
}

function setAuthMode(mode) {
  const signup = mode === "signup";
  $("signin-form").hidden = signup;
  $("signup-form").hidden = !signup;
  $("auth-kicker").textContent = signup ? "JOIN THE WEDDING TEAM" : "WELCOME BACK";
  $("auth-heading").innerHTML = signup ? "A place for every<br>helping hand." : "Sign in to your<br>shared workspace.";
  $("auth-subtitle").textContent = signup
    ? "Request an account. A wedding admin will approve access."
    : "Use your email and password to continue.";
  $("auth-switch").innerHTML = signup
    ? 'Already have access? <button type="button" data-auth-mode="signin">Sign in</button>'
    : 'Need an account? <button type="button" data-auth-mode="signup">Request access</button>';
}

function showAuth(message = "") {
  loadingUserId = null;
  $("auth-screen").hidden = false;
  $("pending-screen").hidden = true;
  $("workspace").hidden = true;
  if (message) notify(message);
}

function showPending() {
  $("auth-screen").hidden = true;
  $("pending-screen").hidden = false;
  $("workspace").hidden = true;
}

function showSetupNeeded() {
  $("auth-screen").hidden = false;
  $("pending-screen").hidden = true;
  $("workspace").hidden = true;
  $("signin-form").hidden = true;
  $("signup-form").hidden = true;
  $("auth-switch").hidden = true;
  $("setup-message").hidden = false;
  $("setup-message").innerHTML = 'The shared database is not connected yet. Create the Supabase project, run <code>supabase/schema.sql</code>, then add its project URL and publishable key to <code>supabase-config.js</code>. Follow <a href="./SETUP.md">the setup guide</a>. This site keeps wedding records locked until the database is configured.';
}

async function loadMembership(user) {
  if (!user || loadingUserId === user.id) return;
  loadingUserId = user.id;
  currentUser = user;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", user.id)
    .maybeSingle();
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id !== user.id) return;
  if (error) {
    loadingUserId = null;
    showAuth();
    notify(`Could not load your account: ${error.message}`);
    return;
  }
  if (!profile || profile.role === "pending") {
    currentProfile = profile || { role: "pending" };
    showPending();
    return;
  }
  if (!["viewer", "editor", "admin"].includes(profile.role)) {
    currentProfile = { ...profile, role: "pending" };
    showPending();
    return;
  }
  currentProfile = profile;
  $("auth-screen").hidden = true;
  $("pending-screen").hidden = true;
  $("workspace").hidden = false;
  $("user-name").textContent = profile.display_name || profile.email || "Wedding member";
  $("user-role").textContent = profile.role;
  $("user-avatar").textContent = (profile.display_name || profile.email || "A").trim().slice(0, 1).toUpperCase();
  $("footer-member").textContent = profile.role === "admin" ? "Admin access" : `${profile.role} access`;
  renderNav();
  await fetchRecords();
  renderPage();
  subscribeToChanges();
}

async function fetchRecords(quiet = false) {
  if (!currentUser) return;
  const loaded = await Promise.all(RECORD_TYPES.map(async (type) => {
    const rows = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await supabase.from(type).select("*").range(start, start + 999);
      if (error) return { type, error };
      rows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return { type, rows };
  }));
  const failed = loaded.find((result) => result.error);
  if (failed) {
    if (!quiet) notify(`Could not load ${failed.type}: ${failed.error.message}`);
    return;
  }
  for (const { type, rows } of loaded) listData[type] = rows;
  for (const type of RECORD_TYPES) {
    listData[type].sort((a, b) => String(a.name || a.title || a.item || "").localeCompare(String(b.name || b.title || b.item || "")));
  }
  renderPage();
  if (!quiet) $("sync-status").innerHTML = "<i></i> Shared workspace";
}

function subscribeToChanges() {
  if (realtimeChannel || !supabase) return;
  realtimeChannel = supabase.channel("wedding-ledger-records");
  for (const table of RECORD_TYPES) {
    realtimeChannel.on("postgres_changes", { event: "*", schema: "public", table }, () => fetchRecords(true));
  }
  realtimeChannel.subscribe();
}

function renderNav() {
  const available = NAV_ITEMS.filter(([id]) => id !== "users" || currentProfile?.role === "admin");
  $("main-nav").innerHTML = available.map(([id, title, icon]) => `
    <button class="nav-link ${currentView === id ? "active" : ""}" data-view="${id}" type="button" aria-label="${escapeHTML(title)}" aria-current="${currentView === id ? "page" : "false"}">
      <span class="nav-icon" aria-hidden="true">${icon}</span><span class="nav-label-text">${escapeHTML(title)}</span>
    </button>`).join("");
}

function canEdit() { return ["admin", "editor"].includes(currentProfile?.role); }

function setView(view) {
  if (view === "users" && currentProfile?.role !== "admin") return;
  currentView = view;
  searchTerm = "";
  renderNav();
  renderPage();
  $("page-content").focus({ preventScroll: true });
}

function renderPage() {
  if (!currentProfile || currentProfile.role === "pending") return;
  $("page-title").textContent = TITLES[currentView] || "Overview";
  $("quick-add").hidden = !canEdit() || !RECORD_TYPES.includes(currentView);
  const page = $("page-content");
  if (currentView === "dashboard") page.innerHTML = renderDashboard();
  else if (RECORD_TYPES.includes(currentView)) page.innerHTML = renderRecordList(currentView);
  else if (currentView === "users" && currentProfile.role === "admin") void renderUsers();
  else if (currentView === "settings") page.innerHTML = renderSettings();
  else page.innerHTML = renderDashboard();
}

function renderDashboard() {
  const allTasks = listData.tasks;
  const openTasks = allTasks.filter((task) => task.status !== "Completed");
  const highPriority = openTasks.filter((task) => ["High", "Critical"].includes(task.priority));
  const confirmedGuests = listData.guests.filter((guest) => guest.rsvp === "Confirmed").reduce((sum, guest) => sum + Number(guest.party || 1), 0);
  const totalBudget = listData.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const assignedDepartments = listData.departments.filter((department) => department.lead).length;
  const upcoming = [...listData.events].filter((event) => event.date).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);
  const taskRows = (highPriority.length ? highPriority : openTasks).slice(0, 5);
  const noData = RECORD_TYPES.every((type) => listData[type].length === 0);
  return `
    <section class="dashboard-hero">
      <div class="dashboard-hero-copy">
        <p class="eyebrow-small">ONE CELEBRATION · MANY HANDS</p>
        <h2>For all the plans<br>behind <em>the day.</em></h2>
        <div class="hero-rule"></div>
        <p>Keep the details close, share the work, and leave a little room for the unexpected.</p>
      </div>
      <img src="./assets/haldi.svg" alt="Ankit and Kajal celebrating Haldi" loading="eager">
    </section>
    <section class="metric-grid" aria-label="Wedding progress">
      ${metric("Teams with a lead", `${assignedDepartments}/${listData.departments.length || 24}`)}
      ${metric("Open tasks", String(openTasks.length))}
      ${metric("Confirmed guests", String(confirmedGuests))}
      ${metric("Planned spend", currency(totalBudget))}
    </section>
    ${noData ? `<div class="warning-box">The shared database is connected, but it has no records yet. Ask an admin to import the existing wedding backup or add the first records.</div>` : ""}
    <div class="dashboard-grid">
      <section><div class="section-heading"><h3>Next on the list</h3><button class="text-link" data-view="tasks" type="button">All tasks&nbsp; →</button></div>
        <div class="task-list">${taskRows.length ? taskRows.map((task) => `<div class="task-row"><div><b>${escapeHTML(task.title || "Untitled task")}</b><small>${escapeHTML(task.department || "No department")} · ${task.due ? `Due ${formatDate(task.due)}` : "No deadline"}</small></div><span class="status-tag ${task.priority === "Critical" ? "alert" : task.priority === "High" ? "waiting" : ""}">${escapeHTML(task.priority || task.status || "Open")}</span></div>`).join("") : `<p class="empty-copy">No open tasks. Add a task when something needs doing.</p>`}</div>
      </section>
      <section><div class="section-heading"><h3>Celebration dates</h3><button class="text-link" data-view="events" type="button">All events&nbsp; →</button></div>
        <div class="event-strip">${upcoming.length ? upcoming.map(eventCard).join("") : `<p class="empty-copy">Dates and venues will appear here when the team adds them.</p>`}</div>
      </section>
    </div>`;
}

function metric(label, value) {
  return `<div class="metric"><span class="metric-label">${escapeHTML(label)}</span><b class="metric-value">${escapeHTML(value)}</b></div>`;
}

function eventCard(event) {
  const date = event.date ? new Date(event.date) : null;
  const day = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN", { day: "2-digit" }) : "—";
  const month = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN", { month: "short" }) : "DATE";
  return `<div class="event-row"><span class="event-date"><b>${day}</b><small>${escapeHTML(month)}</small></span><span><b>${escapeHTML(event.name || "Wedding event")}</b><small>${escapeHTML(event.venue || "Venue to be confirmed")}</small></span></div>`;
}

function titleFor(type) {
  return TITLES[type] || type;
}

function renderRecordList(type) {
  const records = listData[type] || [];
  const columns = TABLE_COLUMNS[type] || [];
  const filtered = records.filter((record) => !searchTerm || Object.values(record).some((value) => String(value ?? "").toLowerCase().includes(searchTerm.toLowerCase())));
  return `<header class="page-heading"><div><p class="eyebrow-small">WEDDING OPERATIONS</p><h2>${escapeHTML(titleFor(type))}</h2><p>${escapeHTML(sectionDescription(type))}</p></div>${canEdit() ? `<button class="button button-primary" type="button" data-add="${type}">+ Add ${escapeHTML(singular(type))}</button>` : ""}</header>
    <div class="records-toolbar"><input class="search-input" id="record-search" type="search" placeholder="Find a ${escapeHTML(singular(type))}…" value="${escapeHTML(searchTerm)}" aria-label="Search ${escapeHTML(titleFor(type))}"><span class="record-count">${filtered.length} ${filtered.length === 1 ? "record" : "records"}</span></div>
    <div class="table-frame"><table class="data-table"><thead><tr>${columns.map((key) => `<th>${escapeHTML(fieldLabel(type, key))}</th>`).join("")}${canEdit() ? "<th>Actions</th>" : ""}</tr></thead><tbody>${filtered.length ? filtered.map((record) => `<tr>${columns.map((key, i) => `<td class="${i === 0 ? "cell-primary" : ""}">${formatCell(type, key, record[key])}</td>`).join("")}${canEdit() ? `<td><div class="table-actions"><button class="table-action" type="button" data-edit="${escapeHTML(type)}" data-id="${escapeHTML(record.id)}">Edit</button><button class="table-action delete" type="button" data-delete="${escapeHTML(type)}" data-id="${escapeHTML(record.id)}">Delete</button></div></td>` : ""}</tr>`).join("") : `<tr><td class="empty-cell" colspan="${columns.length + (canEdit() ? 1 : 0)}">${searchTerm ? "No matching records." : "Nothing here yet. Add the first record when you’re ready."}</td></tr>`}</tbody></table></div>`;
}

function sectionDescription(type) {
  return {
    departments: "The people responsible for each part of the celebration.",
    tasks: "Clear owners and dates keep the small things moving.",
    events: "Dates, venues, captains and the run of show.",
    guests: "RSVPs, rooms and arrivals for the people you love.",
    vendors: "Contacts, commitments and reporting details.",
    payments: "A shared view of planned costs, advances and balances.",
  }[type] || "Wedding team records.";
}

function singular(type) {
  return { departments: "department", tasks: "task", events: "event", guests: "guest", vendors: "vendor", payments: "payment" }[type] || "record";
}

function fieldLabel(type, key) {
  return (FIELDS[type] || []).find(([id]) => id === key)?.[1] || key;
}

function formatCell(type, key, value) {
  if (value === null || value === undefined || value === "") return "<span class=\"muted\">—</span>";
  if (["due", "date", "arrival", "departure"].includes(key)) return escapeHTML(formatDate(value));
  if (["amount", "paid"].includes(key) && ["payments", "vendors"].includes(type)) return escapeHTML(currency(Number(value)));
  if (key === "status" || key === "priority" || key === "rsvp" || key === "severity") {
    const valueText = String(value);
    const statusClass = /confirmed|completed|paid|received|resolved|distributed/i.test(valueText) ? "good" : /critical|blocked|declined|open/i.test(valueText) ? "alert" : /pending|planning|unassigned|high|partial|needed/i.test(valueText) ? "waiting" : "";
    return `<span class="status-tag ${statusClass}">${escapeHTML(valueText)}</span>`;
  }
  return escapeHTML(value);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-IN", { dateStyle: "medium", ...(String(value).includes(":") ? { timeStyle: "short" } : {}) });
}

function currency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function renderSettings() {
  return `<header class="page-heading"><div><p class="eyebrow-small">YOUR WORKSPACE</p><h2>Settings & backup</h2><p>Keep a copy of the wedding records and bring across the data from the old tracker.</p></div></header>
    <div class="warning-box">This website uses Supabase for shared records. Do not put a database password or service-role key in the website. The browser key is public and relies on the database policies installed by the setup script.</div>
    <div class="settings-grid"><section class="panel"><h3>Download a backup</h3><p>Save the current shared records as a JSON file. Keep backups somewhere private because guest and vendor information may be included.</p><button class="button button-secondary" id="export-json" type="button">Download JSON backup</button></section>
    ${canEdit() ? `<section class="panel"><h3>Import existing records</h3><p>Import the JSON backup from the current wedding tracker. Existing records with the same IDs will be updated in the shared database.</p><input class="file-input" id="import-json" type="file" accept=".json,application/json"><button class="button button-primary" id="import-button" type="button">Import backup</button></section>` : ""}
    <section class="panel"><h3>Account access</h3><p>Signed in as <strong>${escapeHTML(currentProfile?.email || currentUser?.email || "")}</strong>. Your current role is <strong>${escapeHTML(currentProfile?.role || "member")}</strong>.</p><p>New sign-ups wait for an admin to grant viewer, editor or admin access.</p></section>
    <section class="panel"><h3>Keep it private</h3><p>Only share access with people helping coordinate the wedding. Guest contact details, rooming and payments should not be copied into public pages or messages.</p></section></div>`;
}

async function renderUsers() {
  const page = $("page-content");
  page.innerHTML = `<header class="page-heading"><div><p class="eyebrow-small">ADMINISTRATION</p><h2>People & access</h2><p>New accounts begin as pending. Give each person the level of access they need.</p></div></header><div class="warning-box">Editors can add and change wedding records. Viewers can only see them. Admins can also manage account access. Only approve people you recognize.</div><div id="users-content" class="panel" style="margin-top:16px">Loading member list…</div>`;
  const { data, error } = await supabase.from("profiles").select("id,email,display_name,role,created_at").order("created_at", { ascending: true });
  if (currentView !== "users") return;
  const container = $("users-content");
  if (error) {
    container.innerHTML = `<p class="empty-copy">Could not load accounts: ${escapeHTML(error.message)}</p>`;
    return;
  }
  const adminCount = (data || []).filter((user) => user.role === "admin").length;
  container.innerHTML = data?.length ? `<div class="table-frame"><table class="data-table user-table"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Access</th></tr></thead><tbody>${data.map((user) => {
    const protectedAdmin = user.id === currentUser.id || (user.role === "admin" && adminCount < 2);
    return `<tr><td class="cell-primary">${escapeHTML(user.display_name || "—")}</td><td>${escapeHTML(user.email || "")}</td><td>${escapeHTML(user.created_at ? formatDate(user.created_at) : "—")}</td><td><label class="sr-only" for="role-${escapeHTML(user.id)}">Access role for ${escapeHTML(user.email || user.id)}</label><select id="role-${escapeHTML(user.id)}" data-role-user="${escapeHTML(user.id)}" ${protectedAdmin ? "disabled" : ""}><option value="pending" ${user.role === "pending" ? "selected" : ""}>Pending</option><option value="viewer" ${user.role === "viewer" ? "selected" : ""}>Viewer</option><option value="editor" ${user.role === "editor" ? "selected" : ""}>Editor</option><option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option></select></td></tr>`;
  }).join("")}</tbody></table></div>` : `<p class="empty-copy">No accounts yet.</p>`;
}

function openRecordDialog(type, record = null) {
  if (!canEdit() || !FIELDS[type]) return;
  activeRecordType = type;
  editingRecordId = record?.id || null;
  $("dialog-eyebrow").textContent = titleFor(type).toUpperCase();
  $("dialog-title").textContent = `${record ? "Edit" : "Add"} ${singular(type)}`;
  $("dialog-fields").innerHTML = FIELDS[type].map(([key, label, kind, options]) => {
    const id = `field-${key}`;
    const value = record?.[key] ?? "";
    let control;
    if (kind === "select") {
      const values = String(options || "").split("|").filter(Boolean);
      control = `<select id="${id}" name="${key}">${values.map((option) => `<option value="${escapeHTML(option)}" ${String(value) === option ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}</select>`;
    } else if (kind === "textarea") {
      control = `<textarea id="${id}" name="${key}" rows="3">${escapeHTML(value)}</textarea>`;
    } else {
      const inputValue = kind === "datetime-local" && value ? String(value).slice(0, 16) : value;
      control = `<input id="${id}" name="${key}" type="${kind}" value="${escapeHTML(inputValue)}" ${kind === "number" ? `min="0" step="${["party", "quantity"].includes(key) ? "1" : "any"}"` : ""} ${key === REQUIRED_FIELD[type] ? "required" : ""}>`;
    }
    return `<label class="${kind === "textarea" ? "wide" : ""}" for="${id}">${escapeHTML(label)}${control}</label>`;
  }).join("");
  $("record-dialog").showModal();
  $("dialog-fields").querySelector("input,select,textarea")?.focus();
}

async function saveRecord(form) {
  if (!canEdit() || !activeRecordType || !form.reportValidity()) return;
  const values = new FormData(form);
  const record = {};
  for (const [key, , kind] of FIELDS[activeRecordType]) {
    const value = values.get(key);
    record[key] = kind === "number" ? (value === "" ? null : Number(value)) : String(value ?? "").trim();
  }
  record.id = editingRecordId || crypto.randomUUID();
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  const { error } = await supabase.from(activeRecordType).upsert({ ...record, updated_by: currentUser.id });
  button.disabled = false;
  if (error) {
    notify(`Could not save: ${error.message}`);
    return;
  }
  $("record-dialog").close();
  notify("Saved to the shared wedding workspace.");
  await fetchRecords(true);
}

async function deleteRecord(type, id) {
  if (!canEdit() || !confirm("Delete this record from the shared wedding workspace?")) return;
  const { error } = await supabase.from(type).delete().eq("id", id);
  if (error) return notify(`Could not delete: ${error.message}`);
  notify("Record deleted.");
  await fetchRecords(true);
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: listData }, null, 2)], { type: "application/json" });
  downloadBlob(blob, "ankit-kajal-wedding-backup.json");
}

function downloadBlob(blob, name) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

async function importBackup() {
  if (!canEdit()) return;
  const file = $("import-json")?.files?.[0];
  if (!file) return notify("Choose a JSON backup first.");
  let parsed;
  try { parsed = JSON.parse(await file.text()); }
  catch { return notify("That file is not valid JSON."); }
  const incoming = parsed?.data || parsed;
  if (!RECORD_TYPES.every((type) => Array.isArray(incoming?.[type]))) {
    return notify("This backup does not contain all wedding sections. Export a JSON backup from the old tracker and try again.");
  }
  const count = RECORD_TYPES.reduce((sum, type) => sum + incoming[type].length, 0);
  const skipped = OPTIONAL_BACKUP_TYPES.reduce((sum, type) => sum + (Array.isArray(incoming[type]) ? incoming[type].length : 0), 0);
  const note = skipped ? ` This backup also contains ${skipped} optional issue, inventory or transport records. They will remain in your original backup and will not be imported.` : "";
  if (!confirm(`Import ${count} core wedding records into the shared database? Records with matching IDs will be updated.${note}`)) return;
  for (const type of RECORD_TYPES) {
    const allowed = new Set(["id", "updated_by", ...FIELDS[type].map(([key]) => key)]);
    const rows = incoming[type].map((record, index) => {
      const row = { id: String(record.id || `${type}-${Date.now()}-${index}`), updated_by: currentUser.id };
      for (const [key, , kind] of FIELDS[type]) {
        if (record[key] !== undefined) row[key] = kind === "number" ? (record[key] === "" || record[key] === null ? null : Number(record[key])) : String(record[key] ?? "");
      }
      return Object.fromEntries(Object.entries(row).filter(([key]) => allowed.has(key)));
    });
    for (let start = 0; start < rows.length; start += 250) {
      const { error } = await supabase.from(type).upsert(rows.slice(start, start + 250));
      if (error) return notify(`Import stopped in ${type}: ${error.message}`);
    }
  }
  await fetchRecords(true);
  notify(`${count} records imported into the shared database.`);
}

async function changeUserRole(userId, role) {
  if (currentProfile?.role !== "admin") return;
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) {
    notify(`Could not update access: ${error.message}`);
    void renderUsers();
    return;
  }
  notify("Account access updated.");
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const mode = event.target.closest("[data-auth-mode]");
    if (mode) return setAuthMode(mode.dataset.authMode);
    const nav = event.target.closest("[data-view]");
    if (nav) return setView(nav.dataset.view);
    const add = event.target.closest("[data-add]");
    if (add) return openRecordDialog(add.dataset.add);
    const edit = event.target.closest("[data-edit]");
    if (edit) {
      const record = listData[edit.dataset.edit].find((item) => item.id === edit.dataset.id);
      return openRecordDialog(edit.dataset.edit, record);
    }
    const remove = event.target.closest("[data-delete]");
    if (remove) return void deleteRecord(remove.dataset.delete, remove.dataset.id);
  });
  $("page-content").addEventListener("input", (event) => {
    if (event.target.id === "record-search") {
      searchTerm = event.target.value;
      const cursor = event.target.selectionStart;
      renderPage();
      const replacement = $("record-search");
      replacement?.focus();
      replacement?.setSelectionRange(cursor, cursor);
    }
  });
  $("page-content").addEventListener("click", (event) => {
    if (event.target.closest("#export-json")) exportBackup();
    if (event.target.closest("#import-button")) void importBackup();
  });
  $("page-content").addEventListener("change", (event) => {
    const role = event.target.closest("[data-role-user]");
    if (role) void changeUserRole(role.dataset.roleUser, role.value);
  });
  $("signin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: form.get("email"), password: form.get("password") });
    if (error) notify(error.message);
  });
  $("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data, error } = await supabase.auth.signUp({
      email: form.get("email"),
      password: form.get("password"),
      options: { data: { display_name: String(form.get("displayName") || "").trim() } }
    });
    if (error) return notify(error.message);
    if (!data.session) {
      notify("Account created. Try signing in. If Supabase asks for email confirmation, switch off Confirm email in the Email provider settings. Admin approval is still required.");
      setAuthMode("signin");
    } else {
      notify("Account created. A wedding admin needs to approve access.");
    }
  });
  $("signout-button").addEventListener("click", () => void supabase.auth.signOut());
  $("pending-signout").addEventListener("click", () => void supabase.auth.signOut());
  $("quick-add").addEventListener("click", () => openRecordDialog(currentView, null));
  $("record-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void saveRecord(event.currentTarget);
  });
  $("dialog-close").addEventListener("click", () => $("record-dialog").close());
  $("dialog-cancel").addEventListener("click", () => $("record-dialog").close());
  $("record-dialog").addEventListener("click", (event) => {
    if (event.target === $("record-dialog")) $("record-dialog").close();
  });
}

async function start() {
  bindEvents();
  const config = window.WEDDING_SUPABASE || {};
  if (!config.url || !config.publishableKey || config.url.includes("YOUR_") || config.publishableKey.includes("YOUR_")) {
    showSetupNeeded();
    return;
  }
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabase = createClient(config.url, config.publishableKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setTimeout(() => void loadMembership(session.user), 0);
      else {
        currentUser = null;
        currentProfile = null;
        if (realtimeChannel) {
          void supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
        showAuth();
        setAuthMode("signin");
      }
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await loadMembership(data.session.user);
    else showAuth();
  } catch (error) {
    showAuth();
    $("setup-message").hidden = false;
    $("setup-message").textContent = `Could not connect to the database. Check the Supabase project URL, public key and network connection. (${error.message})`;
  }
}

bindEvents();
void start();
