# Changelog

## Unreleased

### Added

- Dashboard summaries for daily rhythm, weekly activity, and monthly progress.
- Focus, Health, Journal, Streaks, Savings, Goals, Notes, and Settings feature pages.
- Local persistence for Focus, Health, Journal, Streaks, and Savings through SQLite WebAssembly stored in IndexedDB.
- SQLite database backup export and import from Settings.
- Goals, Notes, and startup-page preference moved into the SQLite-backed data store, with migration from their previous browser storage keys.
- Complete backup and reset coverage for every current module and startup preference.
- SQLite WebAssembly bundled with the app rather than loaded from a CDN.
- Persistence tests for backup round-tripping and failed-import data preservation.

### Documentation

- Updated project status, roadmap, architecture, and persistence decisions to match the implementation on 2026-08-04.

### Cleanup

- Removed the unused Dexie prototype, its shared types, and the unused `useLocalStorage` hook.

### Planned

- V2 will introduce Daily Check-ins, private XP, a personal level, milestones, and a calm weekly recap.
- V2 will not include reset journeys, social comparison, XP loss, or punitive streak mechanics.
