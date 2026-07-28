# ADR 004: Mobile BottomSheet UI Pattern

## Status
Accepted

## Context
Leaflet popups work well on desktop, where a mouse click can precisely open a small window next to a marker. On mobile, tapping a clustered or dense area of markers, and then interacting with a tiny popup window, is poor UX. Furthermore, popups and other floating DOM elements often lead to z-index clipping and ghosting issues on smaller screens.

## Decision
We decided to adopt the BottomSheet pattern for Mobile.
- Whenever a user interacts with a memory on mobile, the details will be presented in a full-width BottomSheet overlay.
- Leaflet `Popup` components are strictly prohibited in the mobile experience.

## Consequences
- **Positive:** A vastly superior, native-feeling mobile experience. No more CSS conflicts or ghosting artifacts.
- **Negative:** Requires custom touch-drag and gesture handling for dismissing the sheet (to be implemented).
