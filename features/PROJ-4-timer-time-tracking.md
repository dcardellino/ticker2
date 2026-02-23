# PROJ-4: Timer & Time Tracking

## Status: In Review
**Created:** 2026-02-22
**Last Updated:** 2026-02-23

## Dependencies
- Requires: PROJ-1 (User Authentication) – time entries are user-scoped
- Requires: PROJ-3 (Task Management) – timers are started on individual tasks

## User Stories
- As a user, I want to start a timer on a task with a single click so that I can quickly begin tracking my work.
- As a user, I want to see the timer counting up in real time (HH:MM:SS) so that I know how long I've been working.
- As a user, I want to stop the timer with a single click so that the elapsed time is saved as a time entry.
- As a user, I want only one timer to be active at a time so that I'm not accidentally tracking multiple tasks simultaneously.
- As a user, I want to see a clear visual indicator on the active task so that I immediately know which task I'm tracking.
- As a user, I want to see the history of all time entries for a task so that I can review past work sessions.

## Acceptance Criteria
- [x] Each task card has a Start/Stop toggle button (play/stop icon from lucide-react)
- [x] Clicking "Start" begins a timer for that task and records a start timestamp in the DB
- [x] The active timer displays a live HH:MM:SS counter that updates every second
- [x] The active task/timer is visually highlighted (e.g., colored border, pulsing indicator, or background change)
- [x] Only one timer can be running at a time across all tasks and projects
- [x] Starting a timer when another is active automatically stops the previous timer and saves its entry
- [x] Clicking "Stop" saves the time entry (start time + end time + calculated duration) to the DB
- [x] Each task shows a list of its time entries (start time, end time, duration) below or in an expandable section
- [x] Time entries are sorted newest first
- [x] If the browser is closed or refreshed while a timer is running, the timer resumes correctly on reload (based on DB start timestamp)
- [x] Duration is displayed in HH:MM:SS format in the history list
- [x] Total tracked time for each task is updated in real time as the timer runs
- [x] Loading state shown while start/stop operations are in progress

## Edge Cases
- User closes the browser tab while a timer is running → on next load, detect the open entry (null end_time) and resume the counter from the saved start_time
- User starts a timer, then navigates to a different project → the active timer indicator/counter is still visible (e.g., in navbar or persistent banner)
- Network error when stopping timer → show error toast, keep timer running; retry save option
- Timer has been running for more than 24 hours (user forgot to stop) → allow stop; save the entry; optionally warn about unusually long duration
- Two browser tabs open for the same user → starting a timer in one tab stops the active timer visible in the other (eventual consistency via re-fetch or realtime subscription)
- User stops a timer that lasted less than 1 second → save the entry (0s duration is valid, or discard entries < 1s based on UX decision – default: discard)

## Technical Requirements
- Timer counter updates every 1000ms using `setInterval` on the client
- Start timestamp stored in DB as UTC ISO 8601; displayed in user's local timezone
- `time_entries` table must have: `id`, `task_id`, `user_id`, `started_at`, `ended_at` (nullable), `duration_seconds` (computed on stop)
- Performance: Start/stop operations respond in < 500ms
- Security: RLS ensures users can only access their own time entries

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Übersicht

Das Feature baut auf dem bestehenden Task-Card-System auf und ergänzt es um einen globalen Timer-Mechanismus. Der Kern der Architektur ist ein **React Context**, der den aktiven Timer-Zustand app-weit verwaltet, damit ein aktiver Timer auch sichtbar bleibt, wenn der Nutzer zwischen Projekten navigiert.

---

### A) Komponentenstruktur

```
App Layout (Root)
+-- ActiveTimerBanner         ← NEU: persistenter Banner mit laufendem Timer
|   +-- Live HH:MM:SS Counter
|   +-- "Stop"-Button
|   +-- Taskname + Projektname
|
+-- Projektseite
    +-- TasksList (bestehend)
        +-- TaskCard (bestehend – erweitert)
            +-- [Play/Stop Button]        ← NEU: Toggle-Button (lucide Play/Square)
            +-- [Pulsierender Indikator]  ← NEU: sichtbar wenn aktiv
            +-- Tracked Time (bereits vorhanden)
            +-- TimeEntriesSection        ← NEU: aufklappbar
                +-- TimeEntryRow (× n)
                    +-- Startzeit, Endzeit, Dauer
```

---

### B) Datenmodell

**Neue Tabelle: `time_entries`**

| Feld | Beschreibung |
|------|-------------|
| `id` | Eindeutige ID |
| `task_id` | Zu welchem Task gehört dieser Eintrag |
| `user_id` | Welchem Nutzer gehört der Eintrag (Sicherheit/RLS) |
| `started_at` | UTC-Zeitstempel: wann der Timer gestartet wurde |
| `ended_at` | UTC-Zeitstempel: wann gestoppt — leer wenn Timer noch läuft |
| `duration_seconds` | Berechnete Dauer in Sekunden (wird beim Stoppen gesetzt) |

Ein offener Eintrag (`ended_at = null`) signalisiert einen laufenden Timer. Beim App-Load wird danach gesucht, um den Timer automatisch fortzusetzen.

---

### C) Globaler Timer-Zustand (React Context)

Ein neuer **`TimerContext`** wird in das App-Layout eingebettet und hält:
- Welcher Task hat gerade einen laufenden Timer?
- Wann wurde er gestartet? (für genaue clientseitige Zeitmessung)

Mehrere Komponenten benötigen diesen Zustand gleichzeitig: Task-Card (Hervorhebung), globaler Banner (Navigation), und Start-Logik (um alten Timer automatisch zu stoppen).

---

### D) API-Endpunkte

| Route | Was passiert |
|-------|-------------|
| `POST /api/time-entries/start` | Stoppt ggf. offenen Eintrag → erstellt neuen Eintrag mit `started_at` |
| `POST /api/time-entries/stop` | Setzt `ended_at`, berechnet `duration_seconds` |
| `GET /api/time-entries?task_id=…` | Lädt die History aller Zeiteinträge für einen Task |

---

### E) Technische Entscheidungen

| Entscheidung | Warum |
|---|---|
| **Startzeit in DB, Zählung im Browser** | Bei Browser-Reload bleibt `started_at` erhalten → Timer resumt korrekt: `now - started_at` |
| **React Context für Timer-State** | Leichtgewichtig, kein Redux nötig. Einzige globale Variable |
| **Einzel-Timer via API erzwingen** | `/start` stoppt immer zuerst jeden offenen Eintrag — kein zweiter Timer kann offen bleiben |
| **Supabase Realtime (optional)** | Für Zwei-Tab-Konsistenz: Änderungen in einem Tab aktualisieren den anderen |
| **Error-Resilience beim Stoppen** | API-Fehler: Timer läuft weiter, Toast mit Retry erscheint — kein Datenverlust |

---

### F) Neue Dateien

| Datei | Zweck |
|---|---|
| `src/contexts/timer-context.tsx` | Globaler Timer-State + Provider |
| `src/hooks/use-timer.ts` | setInterval-Logik, Start/Stop-Aktionen |
| `src/components/timer/active-timer-banner.tsx` | Persistenter Banner (Layout-Ebene) |
| `src/components/timer/timer-display.tsx` | HH:MM:SS Anzeige |
| `src/components/timer/time-entries-section.tsx` | Aufklappbare Eintragsliste pro Task |
| `src/app/api/time-entries/start/route.ts` | API: Timer starten |
| `src/app/api/time-entries/stop/route.ts` | API: Timer stoppen |
| `src/app/api/time-entries/route.ts` | API: History abrufen |

**Bestehende Dateien, die angepasst werden:**
- `src/components/tasks/task-card.tsx` → Play/Stop Button + Hervorhebung + Time Entries Section
- App Layout → TimerProvider + ActiveTimerBanner einbinden

---

### G) Abhängigkeiten

Keine neuen Pakete nötig — alles bereits installiert:
- `lucide-react` — Play + Square Icons
- `sonner` — Toast für Fehlermeldungen
- `@supabase/supabase-js` — DB + optional Realtime
- shadcn/ui `Collapsible` — aufklappbare Time-Entry-History

## QA Test Results

**Tested:** 2026-02-23 | **Result:** 13/13 AC passed after bug fixes | **Build:** ✓ 0 TypeScript errors

### Bugs Found & Fixed

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| BUG-1 | Medium | Stale `total_tracked_time` displayed after timer stop | ✅ Fixed |
| BUG-2 | Low | No retry button for failed stop operations | ✅ Fixed |
| BUG-3 | Low | No warning for timers running >24h | ✅ Fixed |
| BUG-4 | Medium | No real-time sync between multiple browser tabs | ✅ Fixed |
| BUG-5 | Low | Task card header cramped on 375px mobile screens | ✅ Fixed |
| BUG-6 | High | No server-side rate limiting on time-entry API endpoints | ✅ Fixed |
| BUG-7 | Medium | Start endpoint relied solely on RLS for task ownership | ✅ Fixed |
| BUG-8 | Medium | Unbounded `time_entries` aggregation query (no `.limit()`) | ✅ Fixed |
| BUG-9 | Low | `TimerProvider` triggered auth check on unauthenticated pages | ✅ Fixed |
| BUG-10 | Medium | `ActiveTimerBanner` duplicated per-page instead of in root layout | ✅ Fixed |

## Deployment
_To be added by /deploy_
