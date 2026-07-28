# ADR 002: Photo-First Memory Creation

## Status
Accepted

## Context
Traditionally, map-based applications require users to drop a pin and manually enter the location, date, and time. For a memory journaling app, this creates excessive friction. Users remember moments visually (via photos) rather than by exact GPS coordinates.

## Decision
We decided to pivot Memory Box from a "map-first" app to a "photo-first" memory journal organized on a map.
- The creation flow will prioritize photo selection.
- We will extract EXIF metadata (GPS, Date, Time, Orientation) from the photo automatically.
- Users will only be asked to provide data their phone cannot infer (e.g., thoughts, text, privacy settings).

## Consequences
- **Positive:** Massive reduction in user friction. More organic memory creation.
- **Negative:** Requires robust cross-platform EXIF extraction services and handling of photos lacking metadata (e.g., WhatsApp images).
