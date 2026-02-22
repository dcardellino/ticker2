# PROJ-6: Manual Time Entries

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-3 (Task Management) – entries are associated with a task
- Requires: PROJ-4 (Timer & Time Tracking) – shares the same `time_entries` table and UI

## User Stories
- As a user, I want to manually add a time entry to a task so that I can log work I tracked outside the app (e.g., on paper or in a meeting).
- As a user, I want to specify the start time and end time (or duration) of a manual entry so that the data is accurate.
- As a user, I want to edit an existing time entry so that I can correct mistakes in the logged time.
- As a user, I want to delete a time entry so that I can remove incorrect or duplicate entries.

## Acceptance Criteria
- [ ] An "Add Time Entry" button is available in the task's time entry history section
- [ ] The form accepts: date (required), start time (required), end time (required)
- [ ] Duration is automatically calculated from start and end time and displayed in the form
- [ ] Alternatively, user can enter start time + duration (end time auto-calculated)
- [ ] The entry date defaults to today; user can change it to any past date (future dates not allowed)
- [ ] Successful creation adds the entry to the task's history and updates all totals
- [ ] Each time entry in the history list has an "Edit" icon
- [ ] Edit opens a pre-filled form with the same fields as create
- [ ] Successful edit updates the entry in the list immediately
- [ ] Each time entry has a "Delete" icon that triggers a confirmation dialog
- [ ] Confirmed deletion removes the entry and recalculates totals
- [ ] Manual entries are visually distinguishable from timer-created entries (e.g., small "manual" badge)
- [ ] All actions show loading states and error messages on failure

## Edge Cases
- End time is before start time → show validation error "End time must be after start time"
- Duration is 0 (start time equals end time) → show validation error "Duration must be greater than 0"
- User enters a future date → disable or show validation error "Date cannot be in the future"
- Two manual entries for the same task overlap in time → allow it (no overlap validation in MVP; user is responsible for accuracy)
- Very old date entered (e.g., 5 years ago) → allow it; no restriction on historical entries
- User edits a timer-created entry (changes start/end) → same form, mark as manually edited

## Technical Requirements
- Manual entries use the same `time_entries` table as timer entries
- Add a `source` column: `'timer'` or `'manual'` to distinguish entry types
- `duration_seconds` is always calculated on save (`ended_at - started_at`)
- Security: RLS ensures only the owning user can create/edit/delete their entries

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
