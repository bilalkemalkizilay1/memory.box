# Memory Box Architecture Guidelines

This document outlines the architectural rules and dependency directions for the Memory Box project. All contributors (including AI assistants) must strictly adhere to these rules.

## 🌟 The Golden Rule
Dependencies must always point inward. The allowed dependency direction is:
**Platform** ➔ **Feature** ➔ **Shared** ➔ **Services** ➔ **API**

## 🛑 Non-negotiable Rules

1. **Desktop and Mobile are different user experiences.** 
   Never merge them into a responsive component. If a feature requires different UX between platforms, create two implementations.
2. **Business logic exists exactly once.**
   Duplicate UI when necessary, but never duplicate business logic.
3. **Platform-specific UI exists independently.**
   `desktop/*` cannot import `mobile/*`. `mobile/*` cannot import `desktop/*`. Only `shared/*` may be imported by both.
4. **Shared components must be platform agnostic.**
   Code in the `shared/` layer must not know whether it is running on a desktop browser or a mobile device.
5. **Hooks orchestrate services.**
   React Hooks (e.g. `useMemories`) should orchestrate state and side-effects. They must not contain large amounts of business logic.
6. **Services contain business logic.**
   Pure TypeScript classes/functions in `shared/services/` house the core business rules.
7. **API clients never know about UI.**
   The `api/` layer only handles network requests and data parsing. It should not contain state management or UI logic.
8. **UI never performs direct fetches.**
   Components should delegate fetching to hooks and services.
9. **Every new feature must follow:**
   `features/[feature_name]/shared/`
   `features/[feature_name]/desktop/`
   `features/[feature_name]/mobile/`
10. **Every platform must remain independently deployable in the future.**
    The structure is built to support a transition to a Monorepo (`apps/web`, `apps/mobile`, `packages/shared`) in the future.
11. **React Native compatibility should always be considered** before introducing new UI abstractions.

## Directory Aliases
- `@api` ➔ `src/shared/api`
- `@hooks` ➔ `src/shared/hooks`
- `@services` ➔ `src/shared/services`
- `@utils` ➔ `src/shared/utils`
- `@types` ➔ `src/shared/types`
- `@shared` ➔ `src/shared`
- `@features` ➔ `src/features`
- `@desktop` ➔ `src/app/desktop`
- `@mobile` ➔ `src/app/mobile`
