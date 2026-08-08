# Roadmap

Last verified: 2026-08-04

Atlas is in active development. The core V1 experience and its local data-management foundation are complete; verification and refinement are the next priorities.

## Completed

| Area | Delivered functionality |
| --- | --- |
| Application shell | Routed React application, sidebar navigation, responsive dashboard layout |
| Dashboard | Daily focus view and core signals across Focus, Health, Journal, and Streaks; secondary modules remain available through navigation |
| Focus | Add, complete, remove, and persist focus items |
| Health | Edit and persist weight, water, sleep, and workout metrics |
| Journal | Create, search, delete, and persist entries with mood and energy fields |
| Streaks | Create and remove habits; record daily completion and calculate current/best streaks |
| Savings | Record and remove income, expense, and savings entries; calculate a running balance |
| Goals | Add, complete, and remove simple goals |
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

## V2 — Personal motivation

V2 adds motivation to the existing personal workspace. It should reward intentional participation without turning Atlas into a competitive productivity game.

| Area | Planned functionality |
| --- | --- |
| Daily Check-in | A brief morning and evening ritual for mood, energy, intention, win, and reflection. |
| XP event system | Award XP for actions already meaningful in Atlas: check-ins, focus completion, health logging, habits, journal entries, and goals. |
| Personal level | Display one overall Atlas level with a simple, predictable progression bar. |
| Milestones | Mark meaningful personal moments such as a first week of check-ins, 25 completed focus items, 10 journal entries, or 100 total XP. |
| Weekly recap | Summarize check-ins, XP, focus, habits, and a reflection prompt without judgment or ranking. |

### V2 guardrails

- Built for one person, not a broad audience or guided reset programme.
- No reset journeys, public profiles, leaderboards, or social comparison.
- No XP loss, broken-level drama, or punishment for missed days.
- Rewards should recognize showing up and reflection, not just output.
- The UI remains black, white, calm, and uncluttered.

## Later, not committed

- Optional native desktop persistence adapter
- Optional integrations or cloud sync

Authentication, cloud sync, notifications, analytics, and AI features remain outside the current plan unless the product direction changes.
