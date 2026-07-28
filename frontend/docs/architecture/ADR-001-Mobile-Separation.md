# ADR 001: Strict Mobile Separation

## Status
Accepted

## Context
Memory Box initially used responsive CSS and conditional rendering (`isMobile`) within single components to handle both desktop and mobile views. As the application grew, these components became bloated, CSS classes collided, and interaction paradigms (like Sidebar vs. BottomNav) conflicted.

## Decision
We decided to strictly separate the Mobile and Desktop user experiences.
- The `src/app` directory is split into `app/desktop` and `app/mobile`.
- Feature components are split into `desktop/` and `mobile/` implementations.
- Desktop and Mobile components **must never** import each other.
- The root `App.tsx` determines which tree to render based on the platform.

## Consequences
- **Positive:** Dramatically reduced component complexity. Eliminates CSS collisions and UX compromises. Sets the foundation for a future React Native client.
- **Negative:** Minor UI components might need to be duplicated if they are completely identical, though business logic remains 100% shared.
