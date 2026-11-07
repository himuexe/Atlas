# Atlas Architecture

Last verified: 2026-11-07

## Overview

Atlas is a browser-based React application organized around feature modules. React Router owns navigation, feature contexts expose feature state, and persistence is intentionally local-first.

```text
BrowserRouter
  -> App shell and routes
    -> Feature providers and feature components
      -> Feature hooks
        -> Local persistence
           - SQLite WASM database stored in IndexedDB
```

## Implemented modules

- `dashboard`: cross-feature daily, weekly, and monthly summaries, including a neutral local visit-streak indicator
- `focus`, `health`, `journal`, `streaks`, `savings`, `goals`, `notes`: feature state backed by `lib/persistence/sqlite.ts`
- `life`: a routed feature module with an isolated repository boundary, a read-only aggregate dashboard, local profile and Current Self narratives, append-only Ideal Self revisions, an explorer for 20 canonical dimensions, optional built-in/custom attributes, historical entries with audited corrections, per-attribute target revisions, and a separate Personality & Character reflection framework
- `settings`: startup preference and backup import/export through the SQLite database

Shared layout belongs in `src/components/layout`, generic cards in `src/components/ui`, routes in `src/pages`, and shared browser-persistence code in `src/lib/persistence`.

## Visual interaction layer

`motion` provides short, shared route and list transitions; it does not own application state or change feature behavior. Reduced-motion preferences are handled by both Motion settings and CSS. On narrow viewports, the shell exposes the same route links in a horizontally scrollable navigation row.

The Dashboard's decorative scene is isolated in `components/ui/DashboardAtmosphere.tsx` and `components/ui/DashboardScene.ts`. The scene module is loaded only on the Dashboard and imports only the Three.js primitives it uses. Its canvas is decorative and pointer-transparent; all content remains semantic DOM. Rendering is capped at 30 FPS, pauses when the tab is hidden or scene is offscreen, and stops for reduced motion. A static CSS atmosphere remains when WebGL or the scene chunk is unavailable. Scene resources and observers are disposed on unmount. No feature data, persistence, or business logic is owned by this visual layer.

## Persistence model

`src/lib/persistence/sqlite.ts` initializes `sql.js`, creates the schema, and debounces exports of the in-memory database to IndexedDB using `idb-keyval`. The database currently stores:

- journal entries
- focus items
- health state
- streak habits
- savings entries
- goals
- ordered goal milestones in `goal_milestones`, with cascading parent deletion
- notes
- settings, including the startup preference
- unique local visit dates in `visit_days`
- versioned `life_*` records for profile and Current Self context, append-only overall Ideal Self revisions, custom personal values, extensible dimensions and attributes, append-only attribute entries, per-attribute Ideal Self target revisions, activity links, milestones, reflections, events, and the separate trait identity/definition/reflection/example records

Life schema version 7 seeds the 20 built-in dimensions, 35 optional built-in attributes across all 20 dimensions, and 19 optional Personality & Character starter traits. Custom dimensions, attributes, and traits are supported. Additive migrations insert catalogue rows only when stable IDs are unused and preserve matching user-owned records. Version 5 adds audit metadata to entries, allowing an erroneous record to be invalidated without changing its observation and a correction to be appended with a link to the original. Version 6 adds trait identities, immutable definition and reflection revisions, and supporting examples. Version 7 adds explicit financial observation/target metadata, editable reflection timestamps and multi-year periods, and per-metric append-only Health history with undated legacy baselines. Existing Health values are not assigned invented observation dates. Trait definitions and reflections remain separate from Life dimensions, attributes, Personal Values, activities, and milestones. Custom definitions are revised by appending; custom traits can be deactivated without losing history. Supporting examples can be corrected while retaining their original recorded timestamp or explicitly removed. A controlled reset deletes user-owned trait data while retaining built-in traits and definitions. Attribute definitions distinguish measurements, capabilities, and subjective assessments; the editor supports numeric/rating/boolean/counter/frequency/narrative values, while milestones remain separate records and their management UI is deferred. Experiences & Adventure has an optional narrative attribute; the curated catalogue remains smaller than all examples in Part 4. Custom dimension deactivation also deactivates its custom attributes while retaining their histories. Built-in dimensions and attributes are protected from ordinary updates and deletion. Attribute category, value type, unit, financial type, or dimension changes are rejected once entries, targets, or evidence links exist; create a replacement and deactivate the prior definition instead. Version 3 additively extended profile context and added Current Self, overall Ideal Self history, and Personal Values. These profile/reflection fields are optional; Current Self is narrative context, not a duplicate of measurements or other feature records. Life timestamps accepted by persistence must include a timezone and are normalized to ISO-8601 UTC. Attribute history is ordered by recorded time, creation time, then ascending stable ID. Current value uses the same keys in descending order, so a larger ID wins an exact timestamp tie. SQLite date-time parsing orders legacy timestamp strings, with stable IDs resolving exact ties. Backdated observations remain supported. Target revisions are append-only and current state is deterministically derived by creation time and stable ID.

Overall Ideal Self revisions are insert-only through the repository and protected from SQL updates; the current revision is derived by descending creation time and ID. Per-attribute Ideal Self target revisions also remain immutable. Legacy `supersededAt` values remain as imported historical data and are not rewritten. Personal values are editable records with the existing high, medium, low, and maintain priorities. Attribute definitions use update-in-place upserts, and deactivation (`isActive = false`) is the supported removal behavior. There is no physical attribute-delete API; foreign-key constraints prevent deleting a referenced definition, preserving observations, targets, and activity links.

Activity links retain polymorphic source and identifier pairs rather than foreign keys to each feature table. Persistence accepts only known source table names and verifies that the referenced record currently exists, but these references cannot be protected by relational foreign keys and may become stale when source records are later removed. SQLite imports are rejected if `PRAGMA foreign_key_check` reports violations. Settings reset awaits each feature reset and flushes the coalesced SQLite save before showing success; built-in Life dimensions and migration records are retained.

## Life implementation status and scope

The Life page now begins with a read-only aggregate dashboard followed by the existing editing and exploration sections. `LifeDashboard` loads a snapshot through `loadLifeDashboardSnapshot` in the Life repository. It presents profile context (including age calculated at display time from local calendar dates), original Current Self and Ideal Self wording, all 20 canonical and custom dimensions, the latest valid observation and current target per attribute, current Health and Savings summaries, Journal count/recency, Personal Values names, and traits with saved reflections. Dimension records distinguish inactive dimensions, inactive attributes, unconfigured dimensions, configured attributes without observations, and available observations. Observation dates and target dates are shown independently; no completion, progress, ranking, or health trend is calculated.

The dashboard repository uses batched SQLite reads for current valid attribute observations and current target revisions, applying the same recorded-time/creation-time/ID ordering as individual attribute detail. Profile and narrative data come from existing Life records. The Journal summary query reads only count and latest timestamp, never journal body text. The Personality & Character preview reads trait identities and definition/reflection revisions but not supporting examples. Savings uses its existing all-entry balance semantics and is labeled “Savings ledger balance,” not net worth. User-reported Life net-worth and scoped-income records retain currency, effective/reporting dates, and scope; unlike income observations are never summed. Health values are labeled as current snapshots, not dashboard trends. Dashboard reads do not write records; schema v7 supports the separately implemented financial, review, and Health-history foundations.

Part 9 also names progress indicators, development gaps, attention areas, life statistics, and development insights. Phase 1 displays facts only; Part 15 assigns comparisons/charts to Phase 2 and interpretation/suggestions to Phase 3. The owner-approved policy accepts user-reported net worth, scoped income, user-defined learning attributes, and user-defined travel/experience attributes as sufficient Phase 1 sources. Itemized assets/liabilities and specialized learning/travel systems are outside Phase 1. The 35 built-in attributes are optional starters, not an exhaustive checklist; every dimension supports user-created attributes. The separate Personality & Character framework remains independent: schema v6 introduced 19 optional starter traits, custom traits, append-only definition/reflection revisions, and supporting examples.

The custom definition editor supports numeric/counter/frequency measurements, narrative/boolean capabilities, and rating/boolean/narrative subjective assessments. Assessment methodology and measurement source are editable optional metadata. Numeric financial observations require currency; income additionally requires explicit scope and period. Rating scales and frequency periods remain user-defined rather than standardized. Milestone records are separate and user-facing milestone management is deferred to Phase 2.

Milestone persistence exists without a milestone-management UI. `LifeReviewsSection` uses the existing `life_reflections` table for user-authored weekly/monthly/annual/multi-year reviews; daily Journal and attribute entry workflows remain separate. Part 15's monthly reviews are treated as interpreted/data-driven reviews and remain Phase 3. Activity-to-attribute mapping and milestones/achievements remain Phase 2.

Life does not duplicate Health or Savings records or automatically synchronize them into attributes. Health owns its metric history; Savings continues to own its ledger. The local browser database and exported backups are not encrypted by the application; local-first is not equivalent to encryption. On 2026-11-07, Life was inspected at 1440×1000 and 390×844 with no horizontal overflow. Keyboard testing found and fixed focus loss when dimension/attribute views and Profile, Current Self, or Ideal Self editors replace their triggers; focus entry and return were rechecked. The browser accessibility tree exposed semantic headings/regions, native disclosures, labelled controls, alerts/statuses, and review-error descriptions. Reduced-motion mode was emulated and CSS transition reduction verified. Windows Narrator is installed, but this environment exposes no way to capture or inspect its spoken output, so no genuine screen-reader session is claimed. Full evidence and limitations are recorded in the [final roadmap audit](roadmap.md#phase-1-finalization--2026-11-07).

## Master prompt reconciliation

The [final roadmap matrix](roadmap.md#phase-1-finalization--2026-11-07) covers all 104 distinct requirements across the full original prompt and records implementation evidence and phase allocation.

The aggregate dashboard is a read-only overview, not the full Part 9 analytics experience. It does not derive development gaps, attention judgments, trends, or rankings. Part 9 versus Part 15 is resolved as: Phase 1 facts/current information and user-authored states; Phase 2 activity mapping, milestone workflows, comparisons, and charts; Phase 3 interpreted insights, neglect/stagnation analysis, and suggested priorities. A “strongest dimensions” judgment remains excluded because no non-judgmental definition is available.

The dashboard shows available Health metrics and does not aggregate Streaks into a Current Self summary. Users can define additional explicit measurements as custom attributes. Savings is labeled as a ledger balance, and Journal as count/recency without entry text.

Part 7 custom definitions support numeric, rating, boolean, counter, frequency, and narrative forms with compatible kinds. Methodology and measurement source are exposed. Milestones remain separate records. Part 11 authored weekly/monthly/annual/multi-year reviews are Phase 1 and reuse the existing reflection store; computed multi-year comparisons are Phase 2; interpreted monthly reviews are Phase 3.

The Personal Values and Personality & Character models remain separate; no relationship or association is stored. Current Self and profile are current mutable records, whereas overall Ideal Self, attribute targets/entries, and trait definition/reflection histories preserve revisions. This difference is intentional in the delivered scope; no source requirement for Current Self/profile revisions was identified in the audit.

Habit rest days are stored as a JSON weekday array on each `streak_habits` row. Existing databases and imported backups receive the new column with an empty-array default, preserving the former daily schedule. Visit dates use a primary-key local `YYYY-MM-DD` value, making repeat startup writes for the same date idempotent. Both features are included automatically in full SQLite backups; Settings reset clears visit history.

Goal milestones are stored separately from their parent outcomes. The additive `goal_milestones` migration runs during normal initialization and backup import, preserves existing goal rows, adds a `(goalId, position)` index, and uses `ON DELETE CASCADE` for parent deletion. Settings reset clears milestones by deleting the goals. Completing milestones never changes the parent goal's manually controlled completion state.

Goals, Notes, and the startup preference are migrated automatically from their former `localStorage` keys when no corresponding SQLite data exists. They are then removed from `localStorage`.

Vite bundles the `sql.js` WebAssembly asset with the application, so database initialization does not depend on a CDN.

## Deliberate constraints

- No backend, authentication, cloud sync, analytics, notifications, or AI services in V1.
- Life Phase 1 is closed with documented limitations in the final roadmap matrix. Phase 2 and Phase 3 remain deferred.
- Context is used for cross-page feature state; no external global-state library is required today.
- Route pages remain small composition boundaries; feature logic lives in feature folders.

## Follow-up architecture work

1. Perform a human screen-reader pass in an environment that can expose Narrator's spoken output; the current automation environment cannot capture speech.
2. Consider application-level encryption and key management as a future security enhancement; neither IndexedDB nor exported backups are encrypted by Atlas.
3. Keep the persistence layer focused on SQLite in IndexedDB unless a separately approved future requirement justifies an additive, versioned migration.
