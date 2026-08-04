# Roadmap

Last verified: 2026-08-04

Atlas is in active development. The core V1 experience and its local data-management foundation are complete; verification and refinement are the next priorities.

## Completed

| Area | Delivered functionality |
| --- | --- |
| Application shell | Routed React application, sidebar navigation, responsive dashboard layout |
| Dashboard | Daily prompt plus weekly and monthly summaries across Focus, Health, Journal, Streaks, Savings, Goals, and Notes |
| Focus | Add, complete, remove, and persist focus items |
| Health | Edit and persist weight, water, sleep, and workout metrics |
| Journal | Create, search, delete, and persist entries with mood and energy fields |
| Streaks | Create and remove habits; record daily completion and calculate current/best streaks |
| Savings | Record and remove income, expense, and savings entries; calculate a running balance |
| Goals | Add, complete, and remove simple goals |
| Notes | Add and remove personal notes; surface the latest note |
| Settings | Select a startup page, export/import the SQLite data store, and reset selected core data |
| Local persistence | SQLite compiled to WebAssembly, saved in IndexedDB for Focus, Health, Journal, Streaks, and Savings |
| Unified data management | Goals, Notes, and the startup preference now use the same SQLite-backed data store, with automatic migration from their previous `localStorage` keys |
| Backup and reset coverage | SQLite backup includes every module and the startup preference; reset clears every module and restores the default startup page |
| Offline initialization | The SQLite WebAssembly asset is bundled with the application rather than fetched from a CDN |
| Persistence verification | Automated tests cover database export/import and failed-import data preservation |

## In progress / required for V1 completion

| Area | Remaining work |
| --- | --- |
| Quality verification | Add feature-level tests and run accessibility and responsive UI checks. |
| Documentation cleanup | Remove or migrate the unused Dexie implementation once the persistence direction is finalized. |

## Later, not committed

These are possible future directions, not current work:

- Weekly/monthly review improvements
- More deliberate personalization
- Optional native desktop persistence adapter
- Optional integrations or cloud sync

Authentication, cloud sync, notifications, gamification, analytics, and AI features are outside the current V1 scope unless the product direction changes.
