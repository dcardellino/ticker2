# PROJ-4: Timer & Time Tracking

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

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
- [ ] Each task card has a Start/Stop toggle button (play/stop icon from lucide-react)
- [ ] Clicking "Start" begins a timer for that task and records a start timestamp in the DB
- [ ] The active timer displays a live HH:MM:SS counter that updates every second
- [ ] The active task/timer is visually highlighted (e.g., colored border, pulsing indicator, or background change)
- [ ] Only one timer can be running at a time across all tasks and projects
- [ ] Starting a timer when another is active automatically stops the previous timer and saves its entry
- [ ] Clicking "Stop" saves the time entry (start time + end time + calculated duration) to the DB
- [ ] Each task shows a list of its time entries (start time, end time, duration) below or in an expandable section
- [ ] Time entries are sorted newest first
- [ ] If the browser is closed or refreshed while a timer is running, the timer resumes correctly on reload (based on DB start timestamp)
- [ ] Duration is displayed in HH:MM:SS format in the history list
- [ ] Total tracked time for each task is updated in real time as the timer runs
- [ ] Loading state shown while start/stop operations are in progress

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
