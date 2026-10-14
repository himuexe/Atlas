# Atlas

Atlas is a calm, local-first personal operating system for deciding what matters today. It is intentionally focused: the product favors a small number of useful views over a busy productivity dashboard.

**Project status:** V1 is feature-complete and in release validation. Personal gamification is deferred; Atlas is prioritizing a calm, focused core experience. See the [roadmap](docs/roadmap.md) for the precise status.

## What is available now

- Dashboard with a daily focus view, core wellbeing signals, and a neutral local visit streak
- Today's Focus: create, complete, and remove priorities
- Health Snapshot: record weight, water, sleep, and workout data
- Journal: add, search, and delete reflection entries
- Streaks: track habits, daily completion history, optional rest-day schedules, and a labeled weekly view
- Savings: record income, expenses, and savings entries
- Goals and Notes: lightweight personal planning and capture, with optional ordered goal milestones
- Settings: select a startup page, reset all local data, and import/export the SQLite-backed data store

## Current limitations

- Atlas stores all feature data and the startup preference locally in SQLite-backed IndexedDB. Export a backup before clearing browser data.
- Automated verification covers core utility and persistence behavior; final V1 release validation still includes manual accessibility and responsive checks.

## Deferred

Daily Check-ins, XP, levels, milestones, and weekly recap are not on the active roadmap. Existing check-in and XP data remains in local storage and backups. Atlas does not use visit tracking to create check-ins or award XP.

## Technology

- React 19, TypeScript 5, Vite 5
- React Router 6 and Tailwind CSS 3
- `sql.js` persisted through IndexedDB with `idb-keyval`
- SQLite WebAssembly bundled with the application for offline initialization

## Getting started

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Documentation

- [Roadmap and delivery status](docs/roadmap.md)
- [Architecture](docs/architecture.md)
- [Architecture decisions](docs/decisions.md)
- [Changelog](docs/changelog.md)

## Project principles

Atlas should feel calm, minimal, intentional, fast, and personal. The detailed product and engineering guidance lives in [VISION.md](VISION.md), [PROJECT_PRINCIPLES.md](PROJECT_PRINCIPLES.md), and [AGENTS.md](AGENTS.md).
