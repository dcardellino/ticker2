# PROJ-2: Project Management

## Status: Planned
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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
