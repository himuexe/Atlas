# Atlas Architecture

Last verified: 2026-10-14

## Overview

Atlas is a browser-based React application organized around feature modules. React Router owns navigation, feature contexts expose feature state, and persistence is intentionally local-first.

```text
BrowserRouter
  -> App shell and routes
    -> Feature providers and feature components
      -> Feature hooks
        -> Local persistence
           - SQLite WASM database stored in IndexedDB
```

## Implemented modules

- `dashboard`: cross-feature daily, weekly, and monthly summaries, including a neutral local visit-streak indicator
- `focus`, `health`, `journal`, `streaks`, `savings`, `goals`, `notes`: feature state backed by `lib/persistence/sqlite.ts`
- `settings`: startup preference and backup import/export through the SQLite database

Shared layout belongs in `src/components/layout`, generic cards in `src/components/ui`, routes in `src/pages`, and shared browser-persistence code in `src/lib/persistence`.

## Persistence model

`src/lib/persistence/sqlite.ts` initializes `sql.js`, creates the schema, and debounces exports of the in-memory database to IndexedDB using `idb-keyval`. The database currently stores:

- journal entries
- focus items
- health state
- streak habits
- savings entries
- goals
- ordered goal milestones in `goal_milestones`, with cascading parent deletion
- notes
- settings, including the startup preference
- unique local visit dates in `visit_days`

Habit rest days are stored as a JSON weekday array on each `streak_habits` row. Existing databases and imported backups receive the new column with an empty-array default, preserving the former daily schedule. Visit dates use a primary-key local `YYYY-MM-DD` value, making repeat startup writes for the same date idempotent. Both features are included automatically in full SQLite backups; Settings reset clears visit history.

Goal milestones are stored separately from their parent outcomes. The additive `goal_milestones` migration runs during normal initialization and backup import, preserves existing goal rows, adds a `(goalId, position)` index, and uses `ON DELETE CASCADE` for parent deletion. Settings reset clears milestones by deleting the goals. Completing milestones never changes the parent goal's manually controlled completion state.

Goals, Notes, and the startup preference are migrated automatically from their former `localStorage` keys when no corresponding SQLite data exists. They are then removed from `localStorage`.

Vite bundles the `sql.js` WebAssembly asset with the application, so database initialization does not depend on a CDN.

## Deliberate constraints

- No backend, authentication, cloud sync, analytics, notifications, or AI services in V1.
- Context is used for cross-page feature state; no external global-state library is required today.
- Route pages remain small composition boundaries; feature logic lives in feature folders.

## Follow-up architecture work

1. Add feature-level tests and expand persistence coverage to reset and legacy-storage migration.
2. Verify an offline cold start and the responsive, accessible user flows.
3. Keep the persistence layer focused on the active SQLite-in-IndexedDB implementation unless a future architecture decision justifies a change.
