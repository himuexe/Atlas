# Changelog

## Unreleased

### Verified

- Finalized Phase 1 against all 104 audited requirements after owner-approved catalogue and statistics decisions; the roadmap now records the complete status matrix and non-blocking limitations.
- Fixed keyboard focus loss when entering and leaving Life dimension/attribute detail and Profile, Current Self, and Ideal Self editors; associated periodic-review validation errors with controls and gave repeated review actions contextual accessible names.
- Re-ran the complete suite (79 tests / 9 files) and TypeScript/production build. Performed browser accessibility-tree, reduced-motion, desktop (1440px), and mobile (390px) QA with no horizontal overflow. Narrator is installed, but this environment cannot expose speech output; no actual screen-reader session is claimed.
- Phase 1 is closed with documented limitations. IndexedDB data and exported SQLite backups are not encrypted at application level; encryption/key management is a future security enhancement. No Phase 2/3 implementation or commit was made.

### Added

- Added optional user-reported net-worth and scoped-income Life observations and targets, with currency and reporting-period metadata; Savings is not used as a proxy or combined into financial totals.
- Preserved per-metric Health history with undated legacy baselines; the Life dashboard continues to show current Health snapshots rather than inferred trends.
- Added optional user-authored weekly, monthly, annual, and multi-year reflections by extending the existing Life reflection store.
- Expanded the optional Life attribute catalogue to 35 meaningful definitions across all 20 canonical dimensions; custom definition forms now expose supported numeric/boolean types and assessment/source metadata.
- Added Life schema v7 as an additive, transactional migration with export/import, reset, interrupted-migration recovery, financial-data, Health-history, and review persistence coverage.
- Added an optional Personality & Character reflection framework with 19 starter traits, custom traits, append-only definition/reflection history, and editable supporting examples.
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

- Recorded Phase 1G remediation implementation, final approved scope, and remaining non-blocking limitations in the roadmap, architecture, and ADR-011. Phase 1 is closed; no Phase 2/3 work was started.
- Completed a 104-item source-of-truth audit of all 17 parts of `Master Prompt LIFE.txt`; documented implementation evidence, data-model gaps, review-cadence ambiguity, and Part 9/Part 15 phase conflicts in the roadmap, architecture, and ADR-011. Phase 1 remains open.
- Updated project status, roadmap, architecture, and persistence decisions to match the implementation on 2026-08-04.
- Audited Life implementation against the original master prompt; recorded Phase 1 as incomplete and documented the Life Dashboard and other outstanding requirements without changing application functionality.
- Deferred dashboard gamification and superseded ADR-008 with ADR-009; existing check-in and XP data remains preserved.

### Cleanup

- Removed the unused Dexie prototype, its shared types, and the unused `useLocalStorage` hook.

### Deferred

- Daily Check-ins, XP, levels, milestones, and weekly recap are deferred and not on the active roadmap.
