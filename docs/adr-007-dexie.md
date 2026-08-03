## ADR-007 — Dexie for Local Persistence

Date: 2026-08-03

Status: Accepted

Decision

Adopt Dexie (IndexedDB wrapper) for the initial local-first persistence layer in the browser (PWA/web-first).

Context

- Atlas is a local-first application and should work in browsers and PWAs.
- A lightweight, typed, and versioned persistence layer is required to store feature data (focus items, journal entries, health metrics, streaks, and settings).
- Shipping full SQLite via WASM increases bundle size and complexity; desktop-specific native SQLite can be added later for native builds.

Alternatives Considered

- sql.js (SQLite compiled to WASM): true SQLite, but larger bundle and more complex migrations in the browser.
- Plain IndexedDB: fine, but has ergonomics and typing downsides.
- Native SQLite (desktop): recommended for desktop packaging (Electron/Tauri) later.

Consequences

- Use Dexie for a developer-friendly API, transactions, versioning, and good TypeScript support.
- Start with a small schema (version 1) and add migrations inside the DB module as needed.
- Feature modules should access the DB via the exported singleton and optional lightweight service wrappers.

Notes

- Desktop builds can provide an adapter that maps the same service API to native SQLite when packaging the app.
- Record schema changes in future ADRs and implement migrations in the DB module.
