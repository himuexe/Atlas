# Changelog

## Unreleased

### Added

- Dashboard gamification removed from the home view; existing check-in and XP records retained while the features are deferred.
- Local visit streak recorded once per local calendar day and shown neutrally on the dashboard; visit data is backed up and cleared on reset.
- Optional weekday rest schedules for habits, with a more readable seven-day status view and streaks calculated over scheduled days. Schedule changes apply to past dates too, so newly designating a weekday as rest can bridge earlier completions across it.
- Goals now support a calm, accessible outcome-and-milestone roadmap (up to five ordered steps), while outcome completion remains manual.
- Health water updated to 750 ml bottles, with a one-time reset of legacy glass counts because their volume was not recorded.
- Notes can be edited inline, and the latest note is shown only once.
- Savings balance and entry display now derive direction from category, including legacy signed entries.
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
- Deferred dashboard gamification and superseded ADR-008 with ADR-009; existing check-in and XP data remains preserved.

### Cleanup

- Removed the unused Dexie prototype, its shared types, and the unused `useLocalStorage` hook.

### Deferred

- Daily Check-ins, XP, levels, milestones, and weekly recap are deferred and not on the active roadmap.
