# ADR 010: User-Selectable Theme With Dark Mode Support

- Status: Accepted
- Date: 2026-03-05

## Context

The blog currently uses a single visual theme. As article consumption grows across desktop and mobile contexts, readability and comfort need to adapt to user preference, including low-light scenarios.

## Decision

Add first-class theme support with an explicit user choice.

- Provide `light` and `dark` themes in the UI.
- Expose a visible theme toggle so users can switch at any time.
- Persist the selected theme in the browser (local storage).
- On first visit, default to system preference (`prefers-color-scheme`) and then keep user override as source of truth.
- Keep color tokens centralized so both themes use the same semantic design system.
- Ensure accessibility contrast remains valid in both themes.

## Consequences

- The UX becomes more inclusive and user-controlled.
- Frontend complexity increases due to token management and state persistence.
- Testing scope expands: theme initialization, persistence, toggle behavior, and contrast regressions.
- Future visual changes must update both themes as part of definition of done.
