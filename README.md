# Atlas

<div align="center">

# 🧭 Atlas

### *A Personal Operating System*

**Reduce the friction between who you are today and who you want to become.**

---

*A calm, local-first application designed to help you focus on what matters instead of managing endless productivity systems.*

**Status:** 🚧 Active Development

</div>

---

# Philosophy

Most productivity applications eventually become another thing you have to manage.

Atlas is built on a different philosophy.

Instead of trying to optimize every second of your day, Atlas aims to create clarity.

It acts as a personal operating system that helps you make better daily decisions while staying aligned with your long-term goals.

The objective isn't to do more.

It's to do what actually matters.

---

# Vision

Atlas is designed around three simple principles:

- Reduce cognitive load.
- Make important information instantly accessible.
- Encourage consistency rather than perfection.

Every feature added to Atlas should support these principles.

If a feature introduces unnecessary complexity, it does not belong in the application.

---

# Core Features (Version 1)

The first release intentionally keeps the scope small.

## Dashboard

A clean overview of everything important today.

---

## Today's Focus

Select and track the three most important tasks for the day.

---

## Health Snapshot

A quick overview of personal health metrics.

Future versions may include:

- Weight
- Water Intake
- Sleep
- Steps
- Workout Tracking

---

## Daily Journal

A simple place to capture thoughts, wins, reflections and lessons.

---

## Streak Counter

Track consistency for selected habits without unnecessary gamification.

---

## Settings

Personalization and application preferences.

---

# Future Roadmap

Atlas is intentionally being developed in stages.

## Phase 1 — Foundation

- Dashboard
- Journal
- Health Snapshot
- Today's Focus
- Streak Tracking

---

## Phase 2 — Local First

- SQLite Storage
- Persistent Data
- Offline Support
- Backup & Restore

---

## Phase 3 — Intelligence

- AI Reflection
- Weekly Summaries
- Personalized Suggestions
- Goal Tracking

---

## Phase 4 — Ecosystem

- Calendar Integration
- Notifications
- Widgets
- Cross Device Sync
- Optional Cloud Backup

---

# Tech Stack

## Frontend

- React 19
- TypeScript 6
- Vite 8
- React Router

## Styling

- Tailwind CSS v4
- shadcn/ui
- Base UI

## Utilities

- Lucide React
- clsx
- class-variance-authority
- tailwind-merge

---

# Design Principles

Atlas follows several engineering principles.

### Local First

Your data belongs to you.

The application should work without an internet connection whenever possible.

---

### Minimal by Default

Show only what is useful today.

Avoid overwhelming dashboards and unnecessary metrics.

---

### Performance Matters

Fast startup.

Minimal dependencies.

Efficient rendering.

---

### Simplicity Wins

Complexity should exist inside the codebase—not in the user experience.

---

# Development Philosophy

Atlas is also a learning project.

The goal is not only to build an application, but to build it correctly.

Every architectural decision should have a clear reason.

Every dependency should solve a real problem.

Every feature should be understandable months after it is written.

---

# Project Structure

```text
atlas
│
├── docs/
├── src/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── types/
│   └── utils/
│
├── README.md
├── AGENTS.md
└── CONTRIBUTING.md
```

This structure will evolve as the project grows while maintaining clear separation between reusable components and feature-specific logic.

---

# Getting Started

Clone the repository.

```bash
git clone <repository-url>
```

Install dependencies.

```bash
npm install
```

Start the development server.

```bash
npm run dev
```

Create a production build.

```bash
npm run build
```

---

# Current Status

Atlas is currently under active development.

The project is being built incrementally with an emphasis on:

- Clean Architecture
- Maintainability
- Scalability
- Strong TypeScript Practices
- Modern React Patterns

---

# Why Atlas Exists

Atlas is not intended to replace every productivity application.

Instead, it serves as a calm dashboard that helps answer one simple question:

> **"What should I focus on today?"**

Everything else is secondary.

---

# Contributing

Although Atlas is currently a personal project, suggestions, discussions and ideas are always welcome.

Please read **CONTRIBUTING.md** before opening issues or submitting changes.

---

# Documentation

Additional project documentation can be found inside the **docs/** directory.

- Architecture
- Roadmap
- Coding Standards
- Design Decisions
- Changelog

---

# License

This project is licensed under the MIT License.

---

<div align="center">

### "Small improvements, repeated consistently, create extraordinary outcomes."

Built with ❤️ using React, TypeScript and Vite.

</div>