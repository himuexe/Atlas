# Atlas

Atlas is a calm, local-first personal operating system for deciding what matters today. It is intentionally focused: the product favors a small number of useful views over a busy productivity dashboard.

**Project status:** V1 is feature-complete and in release validation. V2 is planned as a personal motivation layer built around daily check-ins and gentle game mechanics. See the [roadmap](docs/roadmap.md) for the precise status.

## What is available now

- Dashboard with a daily focus view and core wellbeing signals
- Today's Focus: create, complete, and remove priorities
- Health Snapshot: record weight, water, sleep, and workout data
- Journal: add, search, and delete reflection entries
- Streaks: track habits and daily completion history
- Savings: record income, expenses, and savings entries
- Goals and Notes: lightweight personal planning and capture
- Settings: select a startup page, reset all local data, and import/export the SQLite-backed data store

## Current limitations

- Atlas stores all feature data and the startup preference locally in SQLite-backed IndexedDB. Export a backup before clearing browser data.
- Automated verification covers core utility and persistence behavior; final V1 release validation still includes manual accessibility and responsive checks.

## Planned for V2

- Morning and evening Daily Check-ins
- XP for intentional actions already tracked in Atlas
- One personal level and gentle milestones
- A calm weekly recap of consistency and progress

V2 is designed for a single personal workspace. It will not include reset journeys, social comparison, XP loss, or punitive streak mechanics.

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
