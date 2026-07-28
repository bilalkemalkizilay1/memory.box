# ADR 003: MapCanvas Plugin Architecture

## Status
Accepted

## Context
We need to render a Leaflet map with Memory markers on both Desktop and Mobile. Initially, these were entirely separate components (`DesktopMapExperience` and `MobileMapExperience`), leading to duplicated `react-leaflet` rendering code (TileLayer, ClusterGroup, etc.).

## Decision
We decided to implement a Plugin/Canvas pattern for the map.
- A shared `MapCanvas` component handles the core map rendering, clustering, and viewport management.
- Desktop and Mobile components act as wrappers that inject platform-specific interaction logic (e.g., clicking a marker on Desktop opens a `<Popup>`, while on Mobile it triggers a state change to open a BottomSheet).

## Consequences
- **Positive:** DRY (Don't Repeat Yourself) map rendering. Easy to add future features like lazy loading or custom clustering exactly once.
- **Negative:** Slightly more complex prop passing for event handlers between the canvas and the platform wrappers.
