## ADR-008 — Personal gamification for V2

Date: 2026-08-04

Status: Accepted

### Decision

Atlas V2 will add Daily Check-ins, private XP, one overall level, personal milestones, and a weekly recap.

### Why

Atlas is being built for one person. The aim is to make meaningful habits easier to return to, not to offer a generic reset programme or compete for attention with noisy productivity apps.

### Guardrails

- Award XP for showing up; never remove XP for a missed day.
- Keep levels, milestones, and progress private.
- Do not add leaderboards, public profiles, social comparison, reset journeys, or pressure-heavy streak mechanics.
- Reuse existing Atlas actions where possible rather than inventing busywork solely to produce points.

### Technical implication

Implement XP as an append-only, local event ledger. Daily Check-ins, levels, milestones, and weekly recap calculations should derive their state from that ledger so results remain explainable and recoverable from backups.
