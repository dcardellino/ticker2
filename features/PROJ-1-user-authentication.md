# PROJ-1: User Authentication

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- None (foundation feature)

## User Stories
- As a new user, I want to register with my email and password so that I can access my personal time tracking data.
- As a returning user, I want to log in with my email and password so that I can continue tracking my projects.
- As a logged-in user, I want to log out so that my data is secure on shared devices.
- As a user who forgot their password, I want to request a password reset email so that I can regain access to my account.
- As a user, I want my session to persist across browser refreshes so that I don't have to log in every time I open the app.

## Acceptance Criteria
- [ ] Registration form accepts email + password (min. 8 characters)
- [ ] Validation error shown for invalid email format
- [ ] Validation error shown if password is too short (< 8 characters)
- [ ] Successful registration redirects user to the projects dashboard
- [ ] Login form accepts email + password and authenticates via Supabase Auth
- [ ] Failed login shows a clear error message ("Invalid credentials")
- [ ] Successful login redirects user to the projects dashboard
- [ ] Logout button clears the session and redirects to the login page
- [ ] All app routes (except /login and /register) redirect unauthenticated users to /login
- [ ] Session is persisted after page refresh (Supabase handles token refresh)
- [ ] Password reset email can be requested from the login page
- [ ] Loading state shown on submit buttons during auth operations
- [ ] All auth forms are accessible (proper labels, keyboard navigation)

## Edge Cases
- User tries to register with an already-registered email → show "Email already in use" error
- User submits login form with empty fields → show required field validation
- Session token expires while user is active → auto-refresh silently; if refresh fails, redirect to login
- User navigates directly to a protected route while logged out → redirect to /login, then back to the intended route after login
- User double-clicks the submit button → prevent duplicate requests (disable button on submit)
- Password reset email link expires → show clear error with option to request a new link

## Technical Requirements
- Auth provider: Supabase Auth (email/password)
- Protected routes via middleware (Next.js middleware.ts)
- Post-login redirect: use `window.location.href` (not `router.push`) to ensure full page reload
- Always verify `data.session` exists before redirecting
- Always reset loading state in all code paths (finally block)
- Token storage: Supabase default (localStorage via `@supabase/ssr`)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponenten-Struktur

```
App (Root Layout)
+-- Middleware (Schutz aller Routen – unsichtbar für User)
|
+-- /login (Seite)
|   +-- AuthCard (Hülle mit Logo/Titel)
|       +-- LoginForm
|           +-- Email-Feld (Input + Label)
|           +-- Passwort-Feld (Input + Label)
|           +-- Fehler-Hinweis (Alert)
|           +-- Anmelden-Button (Button, zeigt Ladeindikator)
|           +-- Links: "Noch kein Konto?" → /register
|                       "Passwort vergessen?" → /forgot-password
|
+-- /register (Seite)
|   +-- AuthCard
|       +-- RegisterForm
|           +-- Email-Feld (Input + Label)
|           +-- Passwort-Feld (Input + Label, min. 8 Zeichen)
|           +-- Fehler-Hinweis (Alert)
|           +-- Registrieren-Button (Button, zeigt Ladeindikator)
|           +-- Link: "Schon ein Konto?" → /login
|
+-- /forgot-password (Seite)
|   +-- AuthCard
|       +-- ForgotPasswordForm
|           +-- Email-Feld (Input + Label)
|           +-- Erfolgs-/Fehler-Hinweis (Alert)
|           +-- Absenden-Button (Button, zeigt Ladeindikator)
|           +-- Link: "Zurück zum Login" → /login
|
+-- /dashboard (und alle weiteren App-Seiten)
    +-- Geschützt durch Middleware → leitet ohne Session zu /login weiter
```

### Datenmodell

Supabase übernimmt die gesamte Datenverwaltung automatisch. Es wird **keine eigene Datenbanktabelle** für Auth benötigt.

- **Benutzer-Datensatz** (Supabase-verwaltet): UUID, E-Mail, verschlüsseltes Passwort, Registrierungszeitpunkt, letzter Login
- **Sitzungs-Token** (im Browser): kurzlebiges Zugriffstoken (automatisch erneuert), langlebiges Auffrischungstoken, Ablaufzeit

### Technische Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Auth-Anbieter | Supabase Auth | Bereits im Tech-Stack, verwaltet Tokens, Hashing und E-Mail-Versand |
| Passwort-Reset | Supabase integrierter E-Mail-Versand | Kein zusätzlicher E-Mail-Dienst nötig |
| Routen-Schutz | Next.js Middleware | Läuft serverseitig vor dem Rendering – sicherer als clientseitiger Schutz |
| Token-Speicherung | Supabase SSR-Bibliothek | Verwaltet localStorage und Cookie-Synchronisation automatisch |
| Nach-Login-Redirect | `window.location.href` | Erzwingt vollständigen Seiten-Reload für korrekten Session-Status |
| Formular-Validierung | react-hook-form + Zod | Bereits im Tech-Stack; client- und serverseitige Validierung |

### Seitenfluss

```
Neuer User:    /register → Konto erstellen → /dashboard
Wiederkehrender User:  /login → Credentials prüfen → /dashboard
Passwort vergessen:    /forgot-password → Reset-Mail → /login
Unautorisiert: /dashboard → Middleware → /login?redirect=/dashboard → nach Login zurück
```

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/middleware.ts` | Schützt alle Routen außer /login, /register, /forgot-password |
| `src/lib/supabase.ts` | Supabase-Client (Browser + Server) |
| `src/app/(auth)/login/page.tsx` | Login-Seite |
| `src/app/(auth)/register/page.tsx` | Registrierungs-Seite |
| `src/app/(auth)/forgot-password/page.tsx` | Passwort-Reset-Seite |
| `src/components/auth/login-form.tsx` | Login-Formular |
| `src/components/auth/register-form.tsx` | Registrierungs-Formular |
| `src/components/auth/forgot-password-form.tsx` | Passwort-Reset-Formular |
| `src/hooks/use-auth.ts` | Hook für Session-Status im Client |

### Abhängigkeiten

| Paket | Zweck |
|---|---|
| `@supabase/supabase-js` | Supabase-Client |
| `@supabase/ssr` | SSR + Cookie-Verwaltung für Next.js |

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
