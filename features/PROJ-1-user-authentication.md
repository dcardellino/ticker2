# PROJ-1: User Authentication

## Status: In Review
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

**Tested:** 2026-02-22
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** Production build passes cleanly (no TypeScript errors)

### Acceptance Criteria Status

#### AC-1: Registration form accepts email + password (min. 8 characters)
- [x] Registration page exists at /register and renders correctly
- [x] Form has email and password fields with proper input types
- [x] Zod schema enforces minimum 8 characters for password (`registerSchema`)
- [x] Form uses react-hook-form with zodResolver for client-side validation
- [x] Submit button labeled "Create account"
- [x] Uses shadcn/ui components (Button, Input, Form, Alert)

#### AC-2: Validation error shown for invalid email format
- [x] Zod schema validates email format with `.email("Please enter a valid email address")`
- [x] FormMessage component renders validation errors inline below the field
- [x] `noValidate` attribute on form prevents browser-native validation, ensuring Zod handles it

#### AC-3: Validation error shown if password is too short (< 8 characters)
- [x] Register schema: `.min(8, "Password must be at least 8 characters")`
- [x] Validation message is rendered via FormMessage component
- [x] Login schema does NOT enforce min 8 (correct -- login should accept any password to check against server)

#### AC-4: Successful registration redirects user to the projects dashboard
- [x] Code checks `data.session` before redirecting
- [x] Uses `window.location.href = "/dashboard"` (correct per technical requirements)
- [ ] BUG: If Supabase has email confirmation enabled (default), `data.session` will be null after signUp and user sees no feedback -- they are stuck on the registration form with no indication of what happened (see BUG-1)

#### AC-5: Login form accepts email + password and authenticates via Supabase Auth
- [x] Login page exists at /login and renders correctly
- [x] Uses `supabase.auth.signInWithPassword()` for authentication
- [x] Form has email and password fields with correct autocomplete attributes

#### AC-6: Failed login shows a clear error message
- [x] Error message: "Invalid email or password. Please try again."
- [x] Error displayed in Alert component with `variant="destructive"`
- [x] Generic catch block handles unexpected errors: "An unexpected error occurred. Please try again."
- [x] Error state is cleared before each new submission attempt

#### AC-7: Successful login redirects user to the projects dashboard
- [x] Code checks `data.session` before redirecting
- [x] Uses `window.location.href = redirectTo` where `redirectTo` defaults to `/dashboard`
- [x] Supports redirect parameter from URL search params for post-login return

#### AC-8: Logout button clears session and redirects to login page
- [x] Dashboard has a Sign out button with `<LogOut>` icon
- [x] `useAuth().signOut()` calls `supabase.auth.signOut()` then redirects to `/login`
- [x] Uses `window.location.href = "/login"` for full page reload
- [x] Sign out button has `aria-label="Sign out"` for accessibility

#### AC-9: All app routes (except /login and /register) redirect unauthenticated users to /login
- [x] Middleware (`src/proxy.ts`) correctly defines public routes: `/login`, `/register`, `/forgot-password`, `/api/auth/callback`
- [x] Verified: `/dashboard` returns 307 redirect to `/login?redirect=%2Fdashboard`
- [x] Verified: `/some-random-protected-route` returns 307 redirect to `/login?redirect=%2Fsome-random-protected-route`
- [x] Middleware matcher excludes static assets (`_next/static`, images, favicon)
- [x] Authenticated users on public routes get redirected to `/dashboard`

#### AC-10: Session is persisted after page refresh (Supabase handles token refresh)
- [x] `useAuth()` hook calls `supabase.auth.getSession()` on mount
- [x] `onAuthStateChange` listener handles session changes and token refresh events
- [x] Supabase SSR client (`@supabase/ssr`) manages cookie-based session storage
- [x] Middleware uses `createSupabaseMiddlewareClient` to refresh tokens server-side on each request

#### AC-11: Password reset email can be requested from the login page
- [x] Login page has "Forgot your password?" link pointing to `/forgot-password`
- [x] Forgot password form exists and uses `supabase.auth.resetPasswordForEmail()`
- [x] Success state shows message: "If an account exists for that email, we sent a password reset link."
- [x] Success message does not reveal whether the email exists (good security practice)
- [x] Redirect URL set to `/api/auth/callback?next=/login` for the reset link

#### AC-12: Loading state shown on submit buttons during auth operations
- [x] Login form: Button disabled during loading, shows `<Loader2>` spinner
- [x] Register form: Button disabled during loading, shows `<Loader2>` spinner
- [x] Forgot password form: Button disabled during loading, shows `<Loader2>` spinner
- [x] Loading state reset in `finally` block on all three forms (correct per technical requirements)

#### AC-13: All auth forms are accessible (proper labels, keyboard navigation)
- [x] shadcn/ui Form component provides `htmlFor`, `aria-describedby`, and `aria-invalid` on form controls
- [x] All inputs have associated `<FormLabel>` elements
- [x] Error messages linked via `aria-describedby` to their respective inputs
- [x] All forms use semantic HTML `<form>` elements
- [x] Clock icon in AuthCard has `aria-hidden="true"`
- [x] Sign out button has `aria-label="Sign out"`
- [ ] BUG: Auth callback error (`?error=auth_callback_error`) on login page is not displayed to the user -- the login form does not read or display URL error params (see BUG-2)

### Edge Cases Status

#### EC-1: Already-registered email on registration
- [x] Code checks for "already registered" in error message (case-insensitive)
- [x] Shows "This email is already in use. Please sign in instead."
- [x] Falls back to showing raw Supabase error if message does not match expected pattern

#### EC-2: Empty fields on login form
- [x] Zod schema requires `.min(1, "Email is required")` for email
- [x] Zod schema requires `.min(1, "Password is required")` for password
- [x] react-hook-form prevents submission until validation passes

#### EC-3: Session token expires while user is active
- [x] `onAuthStateChange` listener in `useAuth()` handles token refresh events
- [ ] BUG: If session refresh fails, the user is not actively redirected to /login from the dashboard. The `useAuth()` hook sets `user` to null but the dashboard page does not check for null user and redirect (see BUG-3)

#### EC-4: Direct navigation to protected route while logged out
- [x] Middleware redirects to `/login?redirect=/intended-path`
- [x] Login form reads `redirect` param: `searchParams.get("redirect") || "/dashboard"`
- [x] After successful login, redirects to the originally intended route
- [ ] BUG: The redirect parameter is used without validation -- an attacker can craft `/login?redirect=https://evil.com` to perform an open redirect after login (see BUG-4)

#### EC-5: Double-click submit button
- [x] All submit buttons have `disabled={loading}` which prevents re-submission while loading
- [x] Loading state is set synchronously at the start of `onSubmit`, so the button is disabled before the next click can fire

#### EC-6: Password reset email link expires
- [ ] BUG: The auth callback route redirects to `/login?error=auth_callback_error` on failure, but the login page does not read or display this error to the user. There is no clear message about link expiration nor an option to request a new link (see BUG-2)

### Security Audit Results

#### Authentication
- [x] Cannot access /dashboard without login (middleware returns 307)
- [x] Cannot access arbitrary protected routes without login
- [x] Auth callback with invalid code redirects to login with error
- [x] Password hashing handled by Supabase (not custom)
- [x] Supabase anon key used (correct for client-side, RLS enforces access)

#### Authorization
- [x] Each user's session is scoped to their own Supabase auth token
- [x] No user data queries exist yet that could leak cross-user data (dashboard is placeholder)

#### Input Validation
- [x] Zod schemas validate email format and password length on client side
- [x] Supabase handles server-side validation of auth credentials
- [ ] BUG: No server-side input validation exists within the application itself. All validation is client-only via Zod + react-hook-form. While Supabase Auth handles its own server validation, the tech spec calls for server-side Zod validation, and the security rules require it (see BUG-5)

#### Open Redirect Vulnerability
- [ ] BUG: Login form reads `redirect` search param and passes it directly to `window.location.href` without any validation. An attacker can craft a phishing URL like `/login?redirect=https://evil.com/fake-login` and share it with a victim. After the victim logs in successfully, they are redirected to the attacker's site (see BUG-4)

#### Rate Limiting
- [ ] BUG: No rate limiting is implemented on any auth endpoints. An attacker could attempt unlimited login requests for brute-force attacks. The security rules explicitly require rate limiting on authentication endpoints (see BUG-6)

#### Security Headers
- [x] X-Frame-Options: DENY (verified in response headers)
- [x] X-Content-Type-Options: nosniff (verified)
- [x] Referrer-Policy: origin-when-cross-origin (verified)
- [x] Strict-Transport-Security: max-age=31536000; includeSubDomains (verified)
- [ ] BUG: `X-Powered-By: Next.js` header is present, leaking server technology information (see BUG-7)

#### Secrets Management
- [x] `.env.local` is in `.gitignore`
- [x] `.env.local.example` contains only placeholder values
- [x] Only `NEXT_PUBLIC_` prefixed env vars are used in browser code
- [x] `.env.local` not accessible via web (middleware redirects to login)

#### CSRF / XSS
- [x] Supabase Auth handles CSRF protection for its own endpoints
- [x] React's JSX escaping prevents stored XSS in rendered content
- [x] `noValidate` on forms is acceptable since Zod handles validation (not a security issue)

### Cross-Browser & Responsive Testing

#### Cross-Browser (Code Review)
- [x] No browser-specific APIs used beyond standard Web APIs
- [x] Uses `window.location.href` which is universally supported
- [x] `localStorage` (via Supabase SSR) is supported in all modern browsers
- [x] All CSS uses Tailwind utility classes (no vendor-specific CSS)
- **Note:** Requires manual browser testing in Chrome, Firefox, and Safari to confirm rendering

#### Responsive (Code Review)
- [x] Auth layout: `flex min-h-screen items-center justify-center p-4` -- centers card on all viewports
- [x] AuthCard: `w-full max-w-md` -- constrains width, full width on mobile
- [x] Dashboard header: responsive breakpoints with `sm:px-6 lg:px-8`, `sm:inline` for email/sign-out text
- [x] Dashboard: `mx-auto max-w-7xl` constrains desktop width
- **Note:** Requires manual viewport testing at 375px, 768px, and 1440px to confirm visual layout

### Bugs Found

#### BUG-1: Registration may silently fail when Supabase email confirmation is enabled
- **Severity:** High
- **Steps to Reproduce:**
  1. Ensure Supabase project has email confirmation enabled (this is the default)
  2. Go to /register
  3. Enter a valid email and password (8+ characters)
  4. Click "Create account"
  5. Expected: User sees a message indicating they should check their email for confirmation
  6. Actual: `data.session` is null (because email is not confirmed yet), so `window.location.href` redirect never fires. Loading spinner stops but user sees no feedback at all -- they are stuck on the form
- **Priority:** Fix before deployment

#### BUG-2: Auth callback errors not displayed on login page
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Click an expired password reset link from email
  2. Auth callback fails and redirects to `/login?error=auth_callback_error`
  3. Expected: Login page shows a clear error message about the expired link with an option to request a new one
  4. Actual: Login page loads normally with no indication that anything went wrong. The `error` URL parameter is completely ignored by the LoginForm component
- **Priority:** Fix before deployment

#### BUG-3: Dashboard does not redirect to login when session expires client-side
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Log in and navigate to /dashboard
  2. Wait for session token to expire (or manually clear auth cookies/localStorage)
  3. The `useAuth()` hook detects the session change and sets `user` to null
  4. Expected: User is automatically redirected to /login
  5. Actual: Dashboard remains displayed with `user?.email` rendering as empty. User sees a broken dashboard with no email displayed and must manually navigate away
- **Priority:** Fix before deployment

#### BUG-4: Open redirect vulnerability in login form
- **Severity:** Critical
- **Steps to Reproduce:**
  1. Craft URL: `http://localhost:3000/login?redirect=https://evil-phishing-site.com/fake-login`
  2. Share this URL with a victim (e.g., via phishing email)
  3. Victim enters their valid credentials and clicks "Sign in"
  4. Login succeeds, `data.session` exists
  5. Expected: User is redirected only to internal application routes
  6. Actual: `window.location.href = "https://evil-phishing-site.com/fake-login"` executes, sending the user to the attacker's site. The attacker could display a fake "session expired" page to harvest credentials again
- **Priority:** Fix before deployment

#### BUG-5: No server-side input validation in the application layer
- **Severity:** Medium
- **Steps to Reproduce:**
  1. All three auth forms use `noValidate` and rely entirely on client-side Zod validation
  2. A user with JavaScript disabled or using API tools (curl, Postman) can submit any data directly to Supabase
  3. Expected: Application has server-side validation (e.g., via Next.js Server Actions or API routes) before passing data to Supabase
  4. Actual: Supabase Auth handles its own validation, but the application layer performs zero server-side validation. The security rules (`.claude/rules/security.md`) state: "Validate ALL user input on the server side with Zod. Never trust client-side validation alone."
- **Note:** For authentication specifically, Supabase Auth provides server-side validation, so this is a Medium rather than Critical issue. However, it sets a bad pattern for future features
- **Priority:** Fix in next sprint

#### BUG-6: No rate limiting on authentication endpoints
- **Severity:** High
- **Steps to Reproduce:**
  1. Send rapid repeated POST requests to Supabase Auth via the client
  2. Expected: After N failed attempts, the user is temporarily blocked or a CAPTCHA is shown
  3. Actual: No rate limiting exists in the application. Supabase has its own rate limits at the infrastructure level, but the application does not implement any additional protection as required by the security rules (`.claude/rules/security.md`: "Implement rate limiting on authentication endpoints")
- **Priority:** Fix before deployment

#### BUG-7: X-Powered-By header leaks server technology
- **Severity:** Low
- **Steps to Reproduce:**
  1. Send any request to the application (e.g., `curl -D - http://localhost:3000/login`)
  2. Expected: No technology fingerprinting headers in response
  3. Actual: Response includes `X-Powered-By: Next.js`, revealing the framework to potential attackers
- **Priority:** Nice to have (add `poweredByHeader: false` to `next.config.ts`)

### Additional Observations

1. **Middleware file naming:** The tech design references `src/middleware.ts` but the implementation uses `src/proxy.ts`. This is correct for Next.js 16 which uses `proxy.ts` as its middleware convention. The tech design document should be updated to reflect this.

2. **No password confirmation field:** The registration form does not include a "confirm password" field. While not explicitly required by the acceptance criteria, this is a common UX pattern that reduces user error during registration.

3. **Login page Suspense boundary:** The login page wraps `<LoginForm />` in `<Suspense>` (because it uses `useSearchParams()`), but the register and forgot-password pages do not. This is currently fine because only the login form uses `useSearchParams()`, but it is inconsistent.

4. **Dashboard page is client-rendered:** The entire dashboard page is `"use client"` and uses `useAuth()` for auth state. This means there is a brief flash of the loading spinner on every page load, even for authenticated users. Server-side auth checking in the page component would provide a better UX.

### Summary
- **Acceptance Criteria:** 11/13 passed (2 have bugs that affect functionality)
- **Edge Cases:** 4/6 passed (2 have bugs)
- **Bugs Found:** 7 total (1 critical, 2 high, 3 medium, 1 low)
- **Security:** Issues found (open redirect, no rate limiting, X-Powered-By leak)
- **Production Ready:** NO
- **Recommendation:** Fix BUG-4 (critical open redirect), BUG-1 (registration feedback), BUG-3 (session expiry redirect), BUG-6 (rate limiting), and BUG-2 (callback error display) before deployment. BUG-5 and BUG-7 can be addressed in the next sprint.

## Deployment
_To be added by /deploy_
