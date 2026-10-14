# Roadmap

Last verified: 2026-10-14

Atlas is in active development. The core V1 experience and its local data-management foundation are complete; verification and refinement are the next priorities.

## Completed

| Area | Delivered functionality |
| --- | --- |
| Application shell | Routed React application, sidebar navigation, responsive dashboard layout |
| Dashboard | Daily focus view and core signals across Focus, Health, Journal, and Streaks; neutral local visit streak; secondary modules remain available through navigation |
| Focus | Add, complete, remove, and persist focus items |
| Health | Edit and persist weight, water, sleep, and workout metrics |
| Journal | Create, search, delete, and persist entries with mood and energy fields |
| Streaks | Create and remove habits; record daily completion; configure weekday rest days; show a labeled seven-day status and calculate current/best streaks over scheduled days. Schedule edits apply to recorded history, so adding a rest weekday can bridge prior completions across that weekday. |
| Savings | Record and remove income, expense, and savings entries; calculate a running balance |
| Goals | Add, manually complete, and remove outcomes; optionally add and reorder up to five milestones on a calm, accessible roadmap |
| Notes | Add and remove personal notes; surface the latest note |
| Settings | Select a startup page, export/import the SQLite data store, and reset all local data |
| Local persistence | SQLite compiled to WebAssembly, saved in IndexedDB for Focus, Health, Journal, Streaks, and Savings |
| Unified data management | Goals, Notes, and the startup preference now use the same SQLite-backed data store, with automatic migration from their previous `localStorage` keys |
| Backup and reset coverage | SQLite backup includes every module and the startup preference; reset clears every module and restores the default startup page |
| Offline initialization | The SQLite WebAssembly asset is bundled with the application rather than fetched from a CDN |
| Persistence verification | Automated tests cover database export/import and failed-import data preservation |

## V1 release readiness

| Area | Remaining work |
| --- | --- |
| Quality verification | Add feature-level tests and run accessibility and responsive UI checks. |

## Deferred, not committed — Personal motivation

Daily Check-ins, XP, levels, milestones, and weekly recap are deferred from the active roadmap. They are not shown on the dashboard, and no Progress page is planned. Existing check-in and XP records remain in the local database and in backups; see [ADR-009](adr-009-gamification-deferred.md), which supersedes [ADR-008](adr-008-personal-gamification.md).

The separately approved visit streak records one local visit per calendar day. It is informational only: it does not create a check-in, award XP, or count as a habit completion.

## Later, not committed

- Optional native desktop persistence adapter
- Optional integrations or cloud sync

Authentication, cloud sync, notifications, analytics, and AI features remain outside the current plan unless the product direction changes.
