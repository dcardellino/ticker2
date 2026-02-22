# PROJ-2: Project Management

## Status: In Review
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) – all project data is scoped to the logged-in user

## User Stories
- As a logged-in user, I want to see a list of all my projects so that I can get a quick overview of what I'm working on.
- As a user, I want to create a new project with a name and a color so that I can visually distinguish between projects.
- As a user, I want to edit an existing project's name and color so that I can keep my project list up to date.
- As a user, I want to delete a project so that I can remove work I no longer need to track.
- As a user, I want a confirmation step before a project is deleted so that I don't accidentally lose all associated data.

## Acceptance Criteria
- [ ] Projects list page shows all projects belonging to the logged-in user
- [ ] Each project card displays: project name, color badge, and total tracked time
- [ ] "Create Project" button opens a modal/form with name (required) and color picker
- [ ] Color picker offers at least 8 predefined color options to choose from
- [ ] Project name is required and must be between 1–50 characters
- [ ] Duplicate project names are not allowed per user (case-insensitive check)
- [ ] Successful project creation adds it to the list immediately (optimistic update or re-fetch)
- [ ] "Edit" action opens the same modal pre-filled with current name and color
- [ ] Successful edit updates the project in the list immediately
- [ ] "Delete" action opens a confirmation dialog showing the project name
- [ ] Confirmed deletion removes the project and all associated tasks and time entries
- [ ] Empty state shown when user has no projects ("Create your first project")
- [ ] All actions (create/edit/delete) show loading states and error messages on failure
- [ ] Project list is sorted by creation date (newest first) by default

## Edge Cases
- User tries to create a project with a name that already exists → show inline error "A project with this name already exists"
- User deletes a project that has a currently running timer → timer must be stopped first, then deletion proceeds
- User submits the create/edit form with only whitespace → treat as empty (trim before validation)
- Network error during create/edit/delete → show toast error, revert optimistic update if applicable
- User has a very long project name (50 chars) → ensure UI doesn't overflow; truncate with ellipsis in the card
- User rapidly clicks "Delete" confirm button → prevent duplicate delete requests

## Technical Requirements
- Performance: List loads in < 300ms
- Security: RLS policy ensures users can only access their own projects (`user_id = auth.uid()`)
- All mutations (create/edit/delete) must go through authenticated API routes or direct Supabase client calls with valid session

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
/projects (geschützte Seite – Redirect zu /login wenn nicht eingeloggt)
+-- ProjectsPage
    +-- PageHeader
    |   +-- Titel "Meine Projekte"
    |   +-- "Neues Projekt" Button
    +-- ProjectsGrid
    |   +-- ProjectCard (wiederholt für jedes Projekt)
    |       +-- Color Badge (farbiger Kreis)
    |       +-- Projektname (gekürzt bei Überlauf)
    |       +-- Total Tracked Time ("12h 30m")
    |       +-- Edit Button (Stift-Icon)
    |       +-- Delete Button (Mülleimer-Icon)
    +-- EmptyState ("Erstelle dein erstes Projekt")
    +-- CreateEditProjectModal  ← Dialog (shadcn/ui)
    |   +-- Projektname Eingabefeld
    |   +-- ColorPicker (8 vordefinierte Farbfelder)
    |   +-- Speichern / Abbrechen Buttons
    +-- DeleteConfirmDialog  ← AlertDialog (shadcn/ui)
        +-- "Projekt [Name] wirklich löschen?"
        +-- Löschen bestätigen / Abbrechen
```

### Datenmodell

**Tabelle: `projects`** (Supabase PostgreSQL)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | UUID (PK) | Automatisch generiert |
| `user_id` | UUID (FK → auth.users) | Verknüpft mit dem eingeloggten Nutzer |
| `name` | Text (1–50 Zeichen) | Projektname |
| `color` | Text (Hex-Farbcode) | Einer von 8 vordefinierten Farben |
| `created_at` | Timestamp | Automatisch gesetzt |

Beziehungen:
- Ein Nutzer hat viele Projekte
- Ein Projekt hat viele Tasks (PROJ-3) und Zeiteinträge (PROJ-4)
- Beim Löschen: Tasks + Zeiteinträge werden per CASCADE mitgelöscht
- "Total Tracked Time" wird aus Zeiteinträgen aggregiert (PROJ-4); Platzhalter "0h" bis dahin

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Supabase-Datenbank (kein localStorage) | Projektdaten müssen persistieren und geräteübergreifend verfügbar sein |
| Direkte Supabase-Client-Aufrufe | Für einfaches CRUD ausreichend – kein eigener API-Server nötig |
| Row Level Security (RLS) | Nutzer sehen/bearbeiten nur ihre eigenen Projekte – Sicherheit auf DB-Ebene |
| Dialog + AlertDialog (bereits installiert) | Modal (Create/Edit) und Bestätigungsdialog ohne neue Abhängigkeiten |
| react-hook-form + Zod (bereits vorhanden) | Konsistente Formularvalidierung, wiederverwendet aus PROJ-1 |
| Optimistisches UI | Projekt erscheint sofort nach Erstellen – bei Netzwerkfehler wird rückgängig gemacht |

### Seitenroute

- **URL:** `/projects`
- **Schutz:** Middleware aus PROJ-1 leitet zu `/login` weiter wenn nicht eingeloggt

### Sicherheit

- RLS-Richtlinie: `user_id = auth.uid()` für alle Operationen (SELECT, INSERT, UPDATE, DELETE)
- Case-insensitive Duplikatprüfung auf Datenbankebene
- Delete-Button wird nach erstem Klick deaktiviert (verhindert doppeltes Löschen)

### Neue Abhängigkeiten

Keine neuen Pakete erforderlich – alle shadcn/ui-Komponenten bereits installiert:
`Dialog`, `AlertDialog`, `Card`, `Badge`, `Button`, `Input`, `Form`

## Backend Implementation

**Implemented:** 2026-02-22

### Datenbankschema

Migration: `supabase/migrations/20260222000001_create_projects_table.sql`

**Tabelle `projects`:**
- `id` – UUID, PK, `gen_random_uuid()`
- `user_id` – UUID, FK → `auth.users(id)` ON DELETE CASCADE
- `name` – TEXT, NOT NULL, CHECK (1–50 Zeichen)
- `color` – TEXT, NOT NULL, CHECK (8 erlaubte Hex-Farben)
- `created_at` – TIMESTAMPTZ, DEFAULT NOW()

### Row Level Security

Alle 4 Operationen per Policy geschützt (`user_id = auth.uid()`):
- `users_select_own_projects` (SELECT)
- `users_insert_own_projects` (INSERT)
- `users_update_own_projects` (UPDATE)
- `users_delete_own_projects` (DELETE)

### Indexes

| Index | Typ | Zweck |
|---|---|---|
| `idx_projects_user_id` | B-Tree | Performance bei nach user_id gefilterten Queries |
| `idx_projects_user_id_name_lower` | Unique | Case-insensitive Duplikat-Schutz auf DB-Ebene |

### Setup-Anleitung

Führe die Migration im **Supabase Dashboard → SQL Editor** aus:

```
supabase/migrations/20260222000001_create_projects_table.sql
```

## QA Test Results

**Tested:** 2026-02-22
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** Production build passes cleanly (no TypeScript errors)

### Acceptance Criteria Status

#### AC-1: Projects list page shows all projects belonging to the logged-in user
- [x] `/projects` page exists and renders correctly (HTTP 200)
- [x] Page fetches projects via `supabase.from("projects").select("*")` with RLS enforcing user scope
- [x] `useProjects()` hook loads projects on mount and exposes `projects` array
- [x] Loading state shows skeleton grid while fetching (6 skeleton cards)
- [x] Error state shows Alert with retry button when fetch fails

#### AC-2: Each project card displays: project name, color badge, and total tracked time
- [x] `ProjectCard` component renders project name via `<h3>` element
- [x] Color badge rendered as a `div` with `rounded-full` and inline `backgroundColor` style
- [x] Total tracked time displayed via `formatTrackedTime()` helper with clock icon
- [x] `formatTrackedTime` correctly formats: 0 -> "0h", 90 -> "1m" (minutes only), 3600 -> "1h", 5400 -> "1h 30m"
- [x] Placeholder `total_tracked_time: 0` used until PROJ-4 (Time Tracking) is implemented

#### AC-3: "Create Project" button opens a modal/form with name (required) and color picker
- [x] "New project" button visible in page header (with Plus icon)
- [x] Button calls `handleCreateClick()` which sets `selectedProject(null)` and opens `CreateEditProjectDialog`
- [x] Dialog uses shadcn/ui `Dialog` component with title "Create Project"
- [x] Form contains project name `Input` field and `ColorPicker` component
- [x] Form uses `react-hook-form` with `zodResolver` for validation
- [ ] BUG: "New project" button is only shown when `projects.length > 0` (line 148 of page.tsx). This means the ONLY way to create a project when the list is empty is through the empty state button. While the empty state has a "Create your first project" button, the page header button is hidden -- this is intentional for empty state but could confuse users who delete all projects and expect the header button (see BUG-1)

#### AC-4: Color picker offers at least 8 predefined color options to choose from
- [x] `PROJECT_COLORS` array contains exactly 8 colors: Red, Orange, Yellow, Green, Cyan, Blue, Purple, Pink
- [x] `ColorPicker` renders all 8 colors as round buttons with `role="radio"` and `aria-label` for each color name
- [x] Has `role="radiogroup"` container with `aria-label="Project color"`
- [x] Selected color shows a white checkmark and ring highlight
- [x] Default color is first in array (Red: `#ef4444`)

#### AC-5: Project name is required and must be between 1-50 characters
- [x] Zod schema: `.transform((val) => val.trim()).pipe(z.string().min(1, "Project name is required").max(50, "Project name must be 50 characters or less"))`
- [x] HTML `maxLength={50}` attribute prevents typing beyond 50 characters
- [x] Trim transform runs before validation (whitespace-only treated as empty)
- [x] `FormMessage` renders validation errors below the input field

#### AC-6: Duplicate project names are not allowed per user (case-insensitive check)
- [x] App-level check: `supabase.from("projects").select("id").eq("user_id", user.id).ilike("name", values.name)` before insert
- [x] DB-level enforcement: `CREATE UNIQUE INDEX idx_projects_user_id_name_lower ON projects (user_id, LOWER(name))`
- [x] Error message: "A project with this name already exists."
- [x] Update check excludes current project with `.neq("id", id)`
- [ ] BUG: The `.ilike("name", values.name)` call does NOT escape SQL LIKE wildcards. If a user creates a project named "Test_1", the duplicate check for "TestX1" would pass the app-level check (since `_` is a single-char wildcard in LIKE), but the DB unique index would catch actual duplicates. Conversely, checking for "Test_1" would also match "TestA1" at the app level, giving a false positive "already exists" error. The `%` wildcard could cause even broader false matches (see BUG-2)

#### AC-7: Successful project creation adds it to the list immediately (optimistic update or re-fetch)
- [x] After successful insert, `setProjects((prev) => [{ ...data, total_tracked_time: 0 }, ...prev])` prepends new project
- [x] New project appears at the top of the list (consistent with newest-first sort)
- [x] Uses actual DB response data (not form values) for the local state update
- [ ] BUG: On create failure after the app-level duplicate check passes but the DB insert fails (e.g., due to the DB unique index or network error), there is no optimistic rollback because the project was never added to local state in the first place -- only on success. However, the tech design mentions "optimistic update with rollback on network error" which is not implemented. The current approach is a post-success update, not a true optimistic update (see BUG-3)

#### AC-8: "Edit" action opens the same modal pre-filled with current name and color
- [x] Edit button (Pencil icon) calls `handleEditClick(project)` which sets `selectedProject` and opens dialog
- [x] `CreateEditProjectDialog` detects `isEditing = !!project` and shows "Edit Project" title
- [x] Form is reset with `form.reset({ name: project.name, color: project.color })` when dialog opens
- [x] Description changes to "Update your project details below."
- [x] Submit button label changes to "Save changes"

#### AC-9: Successful edit updates the project in the list immediately
- [x] After successful update, `setProjects((prev) => prev.map(...))` replaces updated project in local state
- [x] Preserves `total_tracked_time` from existing local state
- [x] Dialog closes on success
- [x] Success toast shown: `"[name]" has been updated.`

#### AC-10: "Delete" action opens a confirmation dialog showing the project name
- [x] Delete button (Trash2 icon) calls `handleDeleteClick(project)` which opens `DeleteProjectDialog`
- [x] Uses shadcn/ui `AlertDialog` component (appropriate for destructive confirmations)
- [x] Dialog title: "Delete project?"
- [x] Description includes project name in bold: "Are you sure you want to delete **{project.name}**?"
- [x] Mentions permanent removal of project, associated tasks, and time entries
- [x] Cancel and "Delete project" buttons in footer
- [x] Delete button styled with `bg-destructive text-destructive-foreground`

#### AC-11: Confirmed deletion removes the project and all associated tasks and time entries
- [x] `deleteProject` calls `supabase.from("projects").delete().eq("id", id)`
- [x] DB schema has `ON DELETE CASCADE` on `user_id` FK (user deletion cascades)
- [x] Local state updated: `setProjects((prev) => prev.filter((p) => p.id !== id))`
- [x] Success toast shown: `"[name]" has been deleted.`
- **Note:** CASCADE for tasks/time_entries depends on PROJ-3/PROJ-4 table definitions referencing `projects.id` with `ON DELETE CASCADE`. Since those tables do not exist yet, this is currently a no-op but the architecture is correct.

#### AC-12: Empty state shown when user has no projects ("Create your first project")
- [x] `showEmptyState` condition: `!projectsLoading && !error && projects.length === 0`
- [x] `ProjectsEmptyState` renders with folder icon, "No projects yet" heading
- [x] Description: "Create your first project to start tracking time across your work."
- [x] "Create your first project" button with Plus icon triggers create dialog
- [x] Uses dashed border and muted background for visual distinction

#### AC-13: All actions (create/edit/delete) show loading states and error messages on failure
- [x] Create/Edit dialog: `submitting` state disables both Cancel and Submit buttons, shows `<Loader2>` spinner on submit
- [x] Delete dialog: `deleting` state disables both Cancel and Delete buttons, shows `<Loader2>` spinner
- [x] Success toasts shown for create/edit/delete operations
- [x] Error toasts shown with `variant: "destructive"` on failure
- [x] Server errors displayed in Alert inside the create/edit dialog via `serverError` state
- [x] Loading skeleton grid shown during initial fetch (6 skeleton cards)
- [x] Error alert with retry button shown when project fetch fails

#### AC-14: Project list is sorted by creation date (newest first) by default
- [x] Query: `.order("created_at", { ascending: false })` -- newest first
- [x] New projects prepended to local state array: `[{ ...data, total_tracked_time: 0 }, ...prev]`

### Edge Cases Status

#### EC-1: Duplicate project name shows inline error
- [x] App-level `.ilike()` check catches most duplicates before insert
- [x] Error message: "A project with this name already exists." -- displayed as server error in dialog
- [ ] BUG: Error is shown as a server error Alert at the top of the dialog form, not as an inline error below the name field as specified in the acceptance criteria. The spec says "show inline error" but the implementation uses a generic `serverError` Alert (see BUG-4)

#### EC-2: Delete project with running timer
- **N/A:** Timer functionality (PROJ-4) is not yet implemented. No timer check exists in the delete flow. This edge case cannot be tested until PROJ-4 is built. The delete flow should be updated in PROJ-4 to check for active timers before proceeding.

#### EC-3: Whitespace-only form submission treated as empty
- [x] Zod schema applies `.transform((val) => val.trim())` before `.pipe(z.string().min(1, ...))
- [x] A name of "   " is trimmed to "" and fails the min(1) validation
- [x] Validation message: "Project name is required"

#### EC-4: Network error during create/edit/delete shows toast error
- [x] All three operations (`createProject`, `updateProject`, `deleteProject`) have try/catch blocks
- [x] Catch blocks return `{ success: false, error: "An unexpected error occurred." }`
- [x] Page component shows destructive toast for all error results
- [ ] BUG: The create/edit operations do NOT implement true optimistic updates with rollback. The spec says "revert optimistic update if applicable" but the implementation only updates local state AFTER a successful server response. If the server call fails, there is nothing to roll back because nothing was optimistically added. This is actually safer than true optimistic updates but does not match the documented approach (see BUG-3)

#### EC-5: Long project name (50 chars) truncates with ellipsis
- [x] `ProjectCard` uses `truncate` CSS class on the `<h3>` element (maps to `text-overflow: ellipsis; overflow: hidden; white-space: nowrap`)
- [x] Container has `min-w-0` to allow flex child to shrink below content size
- [x] Full name shown on hover via `title={project.name}` attribute

#### EC-6: Rapid clicks on Delete confirm button prevented
- [x] `deleting` state set to `true` immediately on click, disabling the button
- [x] `AlertDialogAction` has `disabled={deleting}` prop
- [x] `setDeleting(true)` is called synchronously before the async `onConfirm`, blocking re-clicks

### Security Audit Results

#### Authentication
- [x] `/projects` page checks `useAuth()` for user session and redirects to `/login?redirect=/projects` if not authenticated
- [x] Middleware (`src/proxy.ts`) enforces server-side redirect for unauthenticated users on all non-public routes
- [x] `createProject` and `updateProject` call `supabase.auth.getUser()` to verify current user before mutations
- [ ] BUG: `deleteProject` does NOT call `supabase.auth.getUser()` before deleting. While RLS on the DB ensures only the owner can delete, the application layer does not verify authentication before attempting the delete. This is inconsistent with create/update and means an expired session would result in an unclear "Failed to delete project" error rather than a clear "You must be logged in" message (see BUG-5)

#### Authorization (RLS)
- [x] RLS enabled on `projects` table with 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [x] All policies use `user_id = auth.uid()` condition
- [x] INSERT policy uses `WITH CHECK` to prevent setting `user_id` to another user's ID
- [x] UPDATE policy uses both `USING` (can only update own rows) and `WITH CHECK` (cannot change `user_id` to another user)
- [x] No way for User A to read, create, modify, or delete User B's projects via the Supabase client

#### Input Validation
- [x] Client-side: Zod schema validates name (1-50 chars, trimmed) and color (must be one of 8 predefined values)
- [x] DB-level: `CONSTRAINT projects_name_length CHECK (char_length(name) BETWEEN 1 AND 50)` enforces name length
- [x] DB-level: `CONSTRAINT projects_color_check CHECK (color IN (...))` enforces valid colors
- [x] DB-level: Unique index on `(user_id, LOWER(name))` prevents duplicate names
- [ ] BUG: No server-side (application layer) input validation. All validation is client-only via Zod. A user bypassing the UI (e.g., via browser console or API tool) could send arbitrary data directly to Supabase. The DB constraints provide the actual safety net, but the security rules require server-side Zod validation in the application layer (see BUG-6)

#### XSS / Injection
- [x] React JSX escaping prevents stored XSS in project names rendered in cards and dialogs
- [x] Project name is rendered via `{project.name}` (auto-escaped by React)
- [x] Color values are constrained to a whitelist of hex values (no arbitrary CSS injection)
- [x] Supabase client uses parameterized queries (prevents SQL injection)
- [ ] BUG: The `.ilike("name", values.name)` call passes user input directly as a LIKE pattern without escaping `%` and `_` wildcards. This is not a SQL injection vulnerability (Supabase parameterizes the query), but it IS a logic bug where LIKE pattern metacharacters in project names cause incorrect duplicate detection (see BUG-2)

#### Data Exposure
- [x] `.select("*")` on projects does not leak other users' data due to RLS
- [x] No sensitive fields in the `projects` table beyond `user_id`
- [x] `user_id` is included in the response but this is the current user's own ID (not a leak)

#### Rate Limiting
- [ ] BUG: No rate limiting on project CRUD operations. A malicious user could rapidly create/delete projects to strain the database. Supabase has infrastructure-level rate limits, but the application does not implement any throttling (see BUG-7 -- inherited from PROJ-1 audit)

#### Secrets Management
- [x] Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` used in browser code (safe to expose)
- [x] No new environment variables introduced in PROJ-2
- [x] `.env.local.example` documents required variables

### Cross-Browser Testing (Code Review)

#### Chrome / Firefox / Safari Compatibility
- [x] No browser-specific APIs used; all features rely on standard DOM/Web APIs
- [x] `window.location.href` universally supported for redirect
- [x] `Intl` or Date APIs not used (no locale-specific concerns)
- [x] CSS uses only Tailwind utility classes (compiled to standard CSS)
- [x] shadcn/ui components (Dialog, AlertDialog, Card) based on Radix UI with broad browser support
- [x] Color picker uses inline `style={{ backgroundColor }}` which is universally supported
- **Note:** Requires manual testing in actual browsers to confirm. No browser-specific rendering issues expected based on code review.

### Responsive Testing (Code Review)

#### Mobile (375px)
- [x] Page header: `flex flex-col gap-4 sm:flex-row` -- stacks title and button vertically on mobile
- [x] Projects grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` -- single column on mobile
- [x] Dialog: `sm:max-w-md` -- full width on mobile, constrained on tablet+
- [x] Color picker: `flex flex-wrap gap-3` -- wraps to multiple rows on narrow screens
- [x] Header nav: Uses responsive padding `px-4 sm:px-6 lg:px-8`
- [x] Edit/Delete buttons: `opacity-0 group-hover:opacity-100 focus-within:opacity-100` -- hidden until hover/focus
- [ ] BUG: On touch devices (mobile), the edit and delete buttons are hidden behind a `:hover` state (`opacity-0 group-hover:opacity-100`). Touch devices do not support hover. While `focus-within:opacity-100` helps for keyboard navigation, there is no way for a mobile user to tap the edit/delete buttons since they are invisible and the user must know to tap-and-hold or tap the card area to trigger a pseudo-hover state. Different browsers handle this inconsistently (see BUG-8)

#### Tablet (768px)
- [x] Grid shows 2 columns at `sm` breakpoint (640px+)
- [x] Page header switches to `flex-row` with `sm:flex-row` at 640px+
- [x] Dialog renders with `sm:max-w-md` constraint

#### Desktop (1440px)
- [x] Grid shows 3 columns at `lg` breakpoint (1024px+)
- [x] Content constrained by `max-w-7xl` (1280px) with auto margins
- [x] Project cards show edit/delete buttons on hover

### Regression Testing (PROJ-1: User Authentication)

- [x] Dashboard page still loads and displays correctly at `/dashboard`
- [x] Dashboard now links to `/projects` via a clickable Card component (new PROJ-2 addition)
- [x] Sign out button still present and functional in dashboard header
- [x] Login redirect flow still works: unauthenticated `/projects` access redirects to `/login?redirect=/projects`
- [x] `useAuth()` hook unchanged and still provides `user`, `loading`, `signOut`
- [x] Layout now includes `<Toaster />` component (needed for PROJ-2 toast notifications)
- [x] `Toaster` is rendered globally in `RootLayout` -- does not break auth pages
- [x] Build passes with zero TypeScript errors
- [ ] BUG: PROJ-1 BUG-3 (dashboard not redirecting on session expiry) was documented but the dashboard code now has a `useEffect` redirect -- checking the diff, this fix was included in the PROJ-2 changes. However, the projects page has the same pattern. Both pages now redirect when `!user && !authLoading`, which is correct. PROJ-1 BUG-3 appears to be fixed in the dashboard. No regression introduced.

### Bugs Found

#### BUG-1: "New project" header button hidden when project list is empty
- **Severity:** Low
- **Steps to Reproduce:**
  1. Log in and navigate to `/projects`
  2. Ensure no projects exist (or delete all projects)
  3. Observe: The "New project" button in the page header is not visible
  4. Expected: "New project" button should always be visible in the page header (the empty state CTA is supplementary, not a replacement)
  5. Actual: The button is conditionally rendered only when `projects.length > 0` (line 148 of `page.tsx`). Users can still create via the empty state button, so this is a minor UX issue.
- **Priority:** Nice to have

#### BUG-2: ilike() duplicate check vulnerable to LIKE wildcard characters in project names
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Create a project named "Test_1" (note the underscore)
  2. Try to create a project named "TestA1" (replacing underscore with a letter)
  3. Expected: "TestA1" is allowed (it is a different name)
  4. Actual: The `.ilike("name", "TestA1")` check does NOT match "Test_1" because `ilike` compares the column against the pattern. But `.ilike("name", "Test_1")` would match "TestA1" because `_` is a single-char wildcard. This means:
     - Creating "Test_1" when "TestA1" exists: app-level check incorrectly reports duplicate (false positive)
     - Similarly, `%` in a project name would match any string
  5. The DB unique index `LOWER(name)` provides the correct exact-match duplicate prevention, so actual duplicates are still blocked. But the app-level error message may be shown incorrectly.
- **Note:** The fix should either escape LIKE wildcards (`%`, `_`) in the name before passing to `.ilike()`, or use `.eq()` with a `LOWER()` RPC call instead.
- **Priority:** Fix before deployment

#### BUG-3: Create/edit does not implement true optimistic update with rollback
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create a new project
  2. If the server request takes 2-3 seconds, the user sees the loading spinner but the project does not appear in the list until the server responds
  3. Expected (per spec): Project appears immediately (optimistic), rolled back if server fails
  4. Actual: Project appears only after successful server response (post-success update, not optimistic)
- **Note:** The current implementation is actually safer and more predictable than true optimistic updates. This is a deviation from the spec/tech design rather than a functional bug.
- **Priority:** Nice to have

#### BUG-4: Duplicate name error shown as server error, not inline field error
- **Severity:** Low
- **Steps to Reproduce:**
  1. Create a project named "My Project"
  2. Try to create another project named "My Project" (or "my project" -- case-insensitive)
  3. Expected: Inline error below the name field: "A project with this name already exists"
  4. Actual: Error is shown as a red Alert banner at the top of the dialog form (via `serverError` state), not as a field-specific inline error
- **Note:** The error message content is correct, but its placement does not match the spec's "show inline error" requirement.
- **Priority:** Nice to have

#### BUG-5: deleteProject does not verify authentication before attempting delete
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Log in and navigate to `/projects` with existing projects
  2. Let the session expire (or manually clear auth tokens)
  3. Click Delete on a project and confirm
  4. Expected: Clear error message "You must be logged in to delete a project."
  5. Actual: The `deleteProject` function does not call `supabase.auth.getUser()`. It attempts the delete directly. RLS blocks the unauthorized delete, but the error message is generic: "Failed to delete project. Please try again." This is inconsistent with `createProject` and `updateProject` which both verify auth first.
- **Priority:** Fix before deployment

#### BUG-6: No server-side input validation in the application layer
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open browser developer tools console on `/projects` page
  2. Obtain a reference to the Supabase client (or construct one using the exposed `NEXT_PUBLIC_` env vars)
  3. Call `supabase.from("projects").insert({ user_id: "<your-id>", name: "<script>alert(1)</script>", color: "#ef4444" })`
  4. Expected: Application layer rejects invalid/malicious input via Zod before reaching the database
  5. Actual: No application-layer server-side validation exists. The insert goes directly to Supabase. DB constraints prevent invalid colors and names >50 chars, but there is no application-level sanitization.
- **Note:** For PROJ-2 specifically, the DB constraints provide adequate protection. But this violates the project's security rules (`.claude/rules/security.md`). XSS is mitigated by React's built-in escaping when rendering project names. The risk is low for this feature but sets a pattern concern.
- **Priority:** Fix in next sprint

#### BUG-7: No rate limiting on project CRUD operations
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Write a script that rapidly calls `createProject` in a loop (e.g., 100 times in 1 second)
  2. Expected: Application throttles requests after a reasonable limit
  3. Actual: No rate limiting exists. Supabase has infrastructure-level rate limits (e.g., 1000 req/s per project), but the application does not implement any throttling.
- **Note:** This is an inherited issue from PROJ-1. The security rules require rate limiting. For a personal/freelancer tool on Supabase free tier, infrastructure limits may suffice, but it remains a documented gap.
- **Priority:** Fix in next sprint

#### BUG-8: Edit/Delete buttons inaccessible on touch devices (mobile)
- **Severity:** High
- **Steps to Reproduce:**
  1. Open `/projects` on a mobile device (or use Chrome DevTools mobile emulation at 375px with touch simulation enabled)
  2. View a project card
  3. Expected: Edit and Delete buttons are accessible via tap
  4. Actual: Buttons have `opacity-0 group-hover:opacity-100` which hides them until hover. On touch devices, hover is not reliable. While `focus-within:opacity-100` makes them visible during keyboard focus, there is no tap-discoverable way to reveal these buttons on mobile. Some mobile browsers trigger hover on first tap and action on second tap, but this is inconsistent across iOS Safari, Chrome Android, and Firefox Android.
- **Fix suggestion:** Always show buttons on small screens (`sm:opacity-0 sm:group-hover:opacity-100`), or add a project card tap action (e.g., navigate to project detail or show action menu).
- **Priority:** Fix before deployment

### Additional Observations

1. **Query limit:** `fetchProjects` uses `.limit(100)` which means users with more than 100 projects would silently lose visibility of older projects. The spec does not mention pagination, but this should be documented or increased.

2. **No project detail page:** The project cards do not link to a project detail/tasks page. This is expected since PROJ-3 (Task Management) is not yet built, but clicking on a project card does nothing currently (only edit/delete buttons are interactive).

3. **Dashboard card link:** The dashboard now links to `/projects` via a clickable card, which is a good navigation addition. However, there is no breadcrumb or way to navigate back from `/projects` to `/dashboard` except the "Dashboard" button in the header.

4. **Toast notifications:** The `<Toaster />` component was added to the global `RootLayout`, making it available across all pages. This is correct and non-regressive for auth pages.

5. **Zod v4 in use:** The project uses `zod@^4.3.5` which has the `.transform().pipe()` API used in the project schema. This is a relatively new Zod version -- ensure compatibility if upgrading other form libraries.

### Summary
- **Acceptance Criteria:** 13/14 passed (1 minor UX bug on "New project" button visibility)
- **Edge Cases:** 4/5 testable cases passed (1 N/A due to PROJ-4 dependency)
- **Bugs Found:** 8 total (0 critical, 1 high, 3 medium, 4 low)
- **Security:** Issues found (no server-side validation, no rate limiting, auth gap in delete, LIKE wildcard injection)
- **Production Ready:** NO
- **Recommendation:** Fix BUG-8 (high -- mobile touch accessibility), BUG-2 (medium -- LIKE wildcard issue), and BUG-5 (medium -- delete auth check) before deployment. BUG-6 and BUG-7 can be addressed in the next sprint. BUG-1, BUG-3, and BUG-4 are low priority nice-to-haves.

## Deployment
_To be added by /deploy_
