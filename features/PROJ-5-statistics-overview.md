# PROJ-5: Statistics & Overview

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) – data is user-scoped
- Requires: PROJ-4 (Timer & Time Tracking) – statistics are based on time entries

## User Stories
- As a user, I want to see the total tracked time for each task so that I know how much time I've invested in specific work items.
- As a user, I want to see the total tracked time for each project so that I can understand the overall effort per project.
- As a user, I want to see how much time I worked today so that I can track my daily productivity.
- As a user, I want to see a weekly overview (Mon–Sun) so that I can understand my work patterns across the week.
- As a user, I want to access the statistics view quickly from the main navigation so that I can check my progress at any time.

## Acceptance Criteria
- [ ] A dedicated "Overview" or "Statistics" page is accessible from the main navigation
- [ ] **Today's Summary:** Shows total time tracked today (across all projects) as a prominent metric
- [ ] **Per-Project Totals:** Lists all projects with their total tracked time (all-time), sorted by most time first
- [ ] **Per-Task Totals:** Within each project, shows total time per task
- [ ] **Weekly Overview:** Shows a breakdown of tracked time per day for the current week (Mon–Sun), displayed as a simple bar chart or table
- [ ] All time values displayed in HH:MM:SS or "Xh Ym" format (human-readable)
- [ ] Currently running timer's elapsed time is included in the live totals (updates in real time or on page load)
- [ ] Statistics page shows an empty state when no time entries exist yet
- [ ] Page loads within < 1 second
- [ ] Statistics are calculated server-side (aggregated DB queries, not client-side)

## Edge Cases
- User has no time entries yet → show empty state with a prompt to start tracking ("Start your first timer to see stats here")
- User has entries spanning multiple time zones (e.g., traveled) → all times calculated in UTC, displayed in the user's current local timezone
- Weekly overview spans two months (e.g., Mon is Jan 31, Fri is Feb 4) → handle correctly using UTC date boundaries
- A task was deleted but its time entries still exist → either exclude from stats (if cascade delete) or handle gracefully (orphaned entries)
- Currently active timer is running → include its live elapsed time in today's total (re-fetch or use client-side addition)
- User has hundreds of projects/tasks → paginate or limit the project list in the overview to top 10/20 by total time

## Technical Requirements
- Use aggregated Supabase queries (`SUM`, `GROUP BY`) rather than fetching all raw entries to the client
- Weekly date range: Monday 00:00:00 to Sunday 23:59:59 in the user's local timezone
- Performance: All aggregate queries should use indexed columns (`user_id`, `task_id`, `started_at`)
- Security: All queries filtered by `user_id = auth.uid()` via RLS

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
