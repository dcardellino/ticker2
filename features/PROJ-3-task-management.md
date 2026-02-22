# PROJ-3: Task Management

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- Requires: PROJ-1 (User Authentication) – tasks are user-scoped
- Requires: PROJ-2 (Project Management) – tasks belong to a project

## User Stories
- As a logged-in user, I want to see all tasks for a selected project so that I know what work is tracked under it.
- As a user, I want to create a new task with a name and optional description so that I can describe what I'm working on.
- As a user, I want to edit a task's name and description so that I can keep task details accurate.
- As a user, I want to delete a task so that I can remove work I no longer track.
- As a user, I want a confirmation step before deleting a task so that I don't accidentally lose its time history.
- As a user, I want to navigate from the project list into a specific project to see its tasks.

## Acceptance Criteria
- [ ] Clicking a project from the list navigates to the project detail page showing its tasks
- [ ] Task list shows all tasks belonging to the selected project
- [ ] Each task card displays: task name, optional description (truncated), and total tracked time
- [ ] "Add Task" button opens a modal/form with name (required, 1–100 chars) and description (optional, max 500 chars)
- [ ] Successful task creation adds it to the list immediately
- [ ] "Edit" action opens the same form pre-filled with current values
- [ ] Successful edit updates the task in the list immediately
- [ ] "Delete" action opens a confirmation dialog showing the task name
- [ ] Confirmed deletion removes the task and all its time entries
- [ ] Empty state shown when a project has no tasks ("Add your first task")
- [ ] Breadcrumb navigation: Projects → [Project Name] → Tasks
- [ ] All actions show loading states and error messages on failure
- [ ] Task list is sorted by creation date (newest first) by default

## Edge Cases
- User tries to create a task with a name that already exists in the same project → show inline error "A task with this name already exists in this project"
- User deletes a task that has a currently running timer → timer must be stopped before deletion can proceed (show warning)
- User navigates directly to a task URL for a project that doesn't belong to them → redirect to /projects (404 or 403)
- Task description contains very long text → truncate in card view with "show more" option or tooltip
- User submits form with only whitespace in the name → trim and show required validation error
- Network error during any mutation → show toast error, keep UI in previous state

## Technical Requirements
- Performance: Task list loads in < 300ms
- Security: RLS policy ensures tasks are only accessible by their owner (`projects.user_id = auth.uid()`)
- Tasks must be deleted via cascade when their parent project is deleted (handled at DB level)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
