# ADR-009 — Gamification deferred from the active roadmap

Date: 2026-10-14

Status: Accepted

Supersedes: [ADR-008 — Personal gamification for V2](adr-008-personal-gamification.md)

## Decision

Daily Check-ins, XP, levels, milestones, and weekly recap are deferred and are not part of the active V2 roadmap. They are removed from the dashboard, and no replacement Progress page will be added at this time.

Existing check-in and XP data remains in the local SQLite database and in backups. This decision does not delete, rewrite, or reinterpret that data. A future product decision may revisit these features as an optional, separate experience.

The visit streak is a separate local feature: it records one visit date per local calendar day and does not create a check-in, award XP, or count as a habit completion.

## Rationale

Atlas should prioritize a calm, focused dashboard and avoid motivation mechanics that create pressure or require additional navigation. The requested visit indicator is informational only and must not show alerts or failure messaging.

## Consequences

- The dashboard contains no check-in card, level, milestones, or weekly recap.
- Existing check-in and XP tables are retained for data preservation and backup compatibility.
- The roadmap describes gamification as deferred rather than planned for V2.
- Reintroducing these features requires a new product decision and must remain optional and non-punitive.
