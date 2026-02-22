# Product Requirements Document

## Vision
A focused time tracking web app for solo developers and freelancers to track time across their side hustle projects. It solves the problem of not knowing where time actually goes — enabling better project scoping, productivity insights, and billing transparency. Users can manage projects and tasks, start/stop timers, and view detailed statistics.

## Target Users
**Solo developers and freelancers** managing 2–10 active side projects simultaneously.

**Needs & Pain Points:**
- Lose track of how much time they actually spend on individual projects/tasks
- Need simple, fast time entry without complex enterprise tooling
- Want to see weekly/daily summaries at a glance
- Frustrated by heavyweight tools like Toggl or Harvest for personal use

## Core Features (Roadmap)

| Priority | Feature | Status | ID |
|----------|---------|--------|----|
| P0 (MVP) | User Authentication | Planned | PROJ-1 |
| P0 (MVP) | Project Management | Planned | PROJ-2 |
| P0 (MVP) | Task Management | Planned | PROJ-3 |
| P0 (MVP) | Timer & Time Tracking | Planned | PROJ-4 |
| P0 (MVP) | Statistics & Overview | Planned | PROJ-5 |
| P1 | Manual Time Entries | Planned | PROJ-6 |
| P2 | Dark Mode Toggle | Planned | PROJ-7 |

## Success Metrics
- User can start tracking time within 60 seconds of first login
- Timer accuracy within ±1 second
- All CRUD operations respond in < 500ms
- Statistics page loads within < 1 second
- Zero data loss when browser tab is closed while timer is running

## Constraints
- Solo developer, no fixed deadline (side project)
- Tech stack fixed: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Supabase
- Free tier Supabase (500MB DB, 50k MAU)
- No budget for paid third-party services

## Non-Goals
- No mobile native app (responsive web only)
- No team collaboration / shared projects in MVP
- No invoicing or billing features
- No integrations (GitHub, Jira, Slack) in MVP
- No export to CSV/PDF in MVP
- No offline-first / PWA functionality in MVP

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
