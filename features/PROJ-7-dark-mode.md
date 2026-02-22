# PROJ-7: Dark Mode Toggle

## Status: Planned
**Created:** 2026-02-22
**Last Updated:** 2026-02-22

## Dependencies
- None (pure UI feature, can be implemented independently at any point)

## User Stories
- As a user, I want to toggle between light and dark mode so that I can use the app comfortably in different lighting conditions.
- As a user, I want my theme preference to be remembered so that I don't have to toggle it every time I open the app.
- As a user, I want the app to respect my system's dark mode preference on first visit so that the experience feels native.

## Acceptance Criteria
- [ ] A theme toggle button (sun/moon icon from lucide-react) is visible in the navigation bar
- [ ] Clicking the toggle switches between light mode and dark mode instantly (no page reload)
- [ ] The selected theme is persisted in `localStorage` and restored on page reload
- [ ] On first visit (no saved preference), the app uses the system preference (`prefers-color-scheme`)
- [ ] All shadcn/ui components correctly render in both light and dark themes
- [ ] All custom components (project cards, task cards, timer display, stats) correctly render in dark mode
- [ ] No flash of unstyled content (FOUC) when the page loads in dark mode
- [ ] Theme transition is smooth (CSS transition on background/text colors)
- [ ] The toggle button shows the correct icon for the current state (moon = currently light mode, sun = currently dark mode)

## Edge Cases
- User has no system dark mode preference and no localStorage value → default to light mode
- User changes system preference while app is open → app does NOT auto-switch (manual toggle required); respect the explicit saved preference
- CSS variables (shadcn/ui) correctly override for dark class → test all color tokens
- Print media query → force light mode for printing (no dark mode on paper)

## Technical Requirements
- Implementation: Tailwind CSS `dark` class strategy (add `class="dark"` to `<html>` element)
- Use `next-themes` library for Next.js-compatible theme management (no FOUC)
- No changes to Supabase or API layer (purely client-side)
- All color values use Tailwind dark-mode variants (`dark:bg-*`, `dark:text-*`) or CSS variables

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
