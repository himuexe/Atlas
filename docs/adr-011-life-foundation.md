# ADR-011 — Life foundation and historical records

Date: 2026-11-06

Status: Accepted

## Decision

Atlas introduces Life as a feature module backed by additive, versioned SQLite migrations. The first migration seeds the 20 application-owned dimensions and creates an extensible `life_*` schema for custom dimensions, attributes, profile data, observations, Ideal Self revisions, activity links, milestones, reflections, and events. Version 2 adds validation triggers and immutable attribute-target revisions. Version 3 extends profile context and adds Current Self, append-only overall Ideal Self narratives, and custom personal values without rewriting existing records. Version 4 seeds the approved built-in attribute catalogue only when stable IDs are unused and protects built-in definitions while preserving custom records. Version 5 adds audit metadata for invalidated entries and correction links without changing existing observations. Version 6 adds the separate Personality & Character trait framework and its historical records. Version 7 adds explicit financial observation/target metadata, edit timestamps and multi-year periods for Life reflections, and per-metric append-only Health history with undated baselines for legacy snapshots.

## Rationale

Life data must preserve personal history without taking ownership of the existing Health, Goals, Journal, Savings, or Streaks modules. Observations are immutable; invalidation changes only the validity and audit metadata, and corrections append a linked replacement. Current state is derived from the latest valid observation. Ideal Self changes create revisions rather than overwriting previous aspirations. Accepted timestamps are timezone-qualified and normalized to UTC at the repository boundary; SQLite orders legacy timestamp strings by instant, with stable IDs resolving exact entry timestamp ties. The profile and Current Self hold optional personal narrative context and do not duplicate the existing measurement features.

## Consequences

- No universal Human Score is stored or calculated.
- Priorities use `high`, `medium`, `low`, and `maintain`.
- The Life profile and Current Self are optional local context; overall Ideal Self narratives are append-only revisions.
- Built-in attributes are optional descriptions of capabilities and self-assessments as well as a small number of useful counters. They do not model activities or milestone achievements; the latter remain separate records.
- Attribute metadata that could reinterpret existing entries, targets, or evidence cannot be changed after history exists. Create a replacement attribute instead, then deactivate the prior definition.
- Custom dimensions and attributes are deactivated rather than physically removed. Deactivating a custom dimension also deactivates its custom attributes while preserving their histories.
- Attributes distinguish measurement, capability, and subjective-assessment kinds.
- Life milestones use `life_milestones`; deferred gamification `milestones` remains untouched.
- Activity links are evidence only and do not calculate development automatically.
- Attribute definitions with history are deactivated rather than physically deleted. No attribute-delete operation is provided.
- Activity links use a supported-source allowlist and validate source IDs when written; polymorphic source links cannot use relational foreign keys and can become stale after source deletion.
- Backup imports run a foreign-key integrity check before replacing the active database.
- Settings reset preserves built-in dimensions and migration records and awaits durable persistence before reporting success.
- Financial observations remain user-reported: net worth is not computed from Savings or an asset inventory, and income requires currency, scope, and reporting dates. Financial numeric targets retain the same metadata.
- Health remains the single source for Health facts; migration preserves each available legacy metric as an undated baseline, and later values append to per-metric history.
- User-authored weekly/monthly/annual/multi-year reviews reuse `life_reflections`; no duplicate review table or generated interpretation is introduced.
- Future migrations increment `life_schema_migrations` and remain additive; historical timestamps are not rewritten.

## Phase 1 scope audit

At the time of the 2026-11-06 source-of-truth audit, before Phase 1E, the aggregate Life Dashboard and a first-class personality/character framework were outstanding. The audit's other findings and evidence are recorded in the [roadmap audit](roadmap.md#life-phase-1-source-of-truth-audit). That audit did not authorize Phase 2.

## Phase 1E — Personality & Character

Schema version 6 keeps character traits independent from dimensions, attributes, Personal Values, activities, and achievements. It stores stable trait identities, append-only definition revisions, append-only Current Self/Ideal Self reflection revisions, and separately editable supporting examples. Nineteen optional starter traits are seeded with stable IDs; custom traits can be defined, revised, and deactivated. Trait importance is qualitative and optional. No scoring, ranking, personality assessment, or activity inference is performed. Example corrections preserve the original recorded timestamp; users may explicitly remove examples. Settings reset clears user-created trait records and reflections/examples while preserving built-in traits and definitions. Migration and trait behavior are covered by SQLite persistence tests and domain-validation tests.

At the time of the Phase 1E decision, the aggregate dashboard remained outstanding. Subsequent Phase 1F and 1G work addressed the dashboard and additional data foundations, but Phase 1 remains open pending final requirements reconciliation. This ADR does not authorize Phase 2.

## Phase 1G — Source-of-truth reconciliation addendum

The aggregate Life Dashboard was implemented after the Phase 1E status above was recorded. The dashboard reads existing profile, reflection, dimension, attribute, Health, Savings, Journal, Values, and Character data without creating duplicate records or adding a schema migration. Its factual presentation intentionally avoids scores, dimension rankings, narrative gap generation, and unsupported progress interpretations.

The full master prompt was audited requirement by requirement in the [roadmap matrix](roadmap.md#complete-master-prompt-requirement-matrix), covering 104 distinct requirements. The findings in the audit below describe the state at audit time, not the subsequent remediation state. It identified a partial Part 4 catalogue, limited custom attribute types, absent authored review UI, unavailable structured statistics, and Part 9/Part 15 conflicts. Factual Phase 1 dashboard data was distinguished from comparisons/charts assigned to Phase 2 and interpreted intelligence assigned to Phase 3.

### Phase 1G — Remediation implementation

The authorized Phase 1 remediation extends schema v7 without adding dependencies or external services. It adds user-reported net-worth and scoped-income records with currency and reporting-period metadata, per-metric Health history with undated legacy baselines, and a user-authored periodic-review UI reusing `life_reflections`. The built-in attribute catalogue now has 35 optional attributes across all 20 canonical dimensions; the attribute editor exposes all six non-milestone value forms and its persisted methodology/source fields. Financial facts, Health snapshots, and authored reflections are integrated into the Life overview only as factual sourced data.

The Phase 11/15 review-cadence ambiguity is resolved by distinguishing authored reviews from interpreted reviews: weekly, monthly, annual, and multi-year authored reflections are Phase 1; Part 15's monthly interpreted review remains Phase 3. User-authored multi-year reflections do not calculate comparisons; those remain Phase 2. Milestone management, activity mapping, progress comparisons/charts, and interpreted insights remain deferred. No Phase 2 or Phase 3 implementation was started.

Migration v7 is transactional and additive. Tests simulate a populated v6 database, removal of v7 additions, interrupted seeding, and a successful retry, and cover financial metadata, Health baselines, review date preservation, backup/import, and reset. The full test suite and production TypeScript/Vite build pass. Manual visual QA at desktop and mobile widths found no horizontal overflow; keyboard disclosure activation was verified. At this remediation checkpoint, component-level accessibility and reduced-motion audits remained outstanding. Phase 1 was not declared complete: the full disposition of every Part 4 example and remaining data-source limitations still required review.

## Phase 1G closeout — 2026-11-07

The final audit read the original master prompt, the complete 104-item initial matrix, current architecture/roadmap/ADR/changelog, Life source, and SQLite migrations. The roadmap now includes an explicit disposition for every Part 4 example and a final Phase 1 matrix. Thirty-five optional built-ins cover all canonical dimensions; other concepts are explicitly attributed to current features, separate traits, custom user-authored attributes, Phase 2 activity/milestone workflows, or stated rationale. This closes the classification gap, but not the open product question of whether custom configurability satisfies the prompt's “multiple attributes per dimension” wording; no additional attributes were seeded merely to increase the count.

No schema change was required for closeout. The existing v7 migration and populated-database migration/backup/reset tests were reverified. The full suite passes 79 tests in 9 files, and `npm run build` passes. Manual Life QA at desktop/mobile sizes found no horizontal overflow. Keyboard testing identified focus loss when detail/editor states replaced their triggering controls; focus now moves to the resulting section heading/first field and returns to the trigger on exit. Review-period validation errors are linked to form controls and repeated review actions have contextual accessible names. Reduced-motion mode and the browser accessibility tree were checked. This does not constitute a real NVDA/JAWS/Narrator session; human assistive-technology verification remains outstanding.

At this 2026-11-07 audit checkpoint, final approval was **not recommended yet** because product decisions remained open. The subsequent Phase 1 finalization section below records those owner-approved decisions and supersedes this historical recommendation. Career milestones, activity relationships, comparisons/charts, and interpreted insights remain deferred to Phases 2 and 3.

## Phase 1 finalization — 2026-11-07

The owner approved the remaining product policies: the 35 built-in attributes are optional starters, custom attributes provide meaningful coverage in each dimension, user-reported net worth is sufficient, income remains explicitly scoped, and user-defined attributes support learning and travel statistics. Itemized assets/liabilities and specialized learning/travel systems are outside Phase 1. The complete 104-requirement matrix and final evidence are in the [roadmap](roadmap.md#phase-1-finalization--2026-11-07); that matrix supersedes the earlier open-approval recommendations in this ADR and roadmap.

**Phase 1 is CLOSED WITH DOCUMENTED LIMITATIONS.** Part 9 versus Part 15 is resolved as factual/user-authored Phase 1 functionality, activity mappings/milestones/comparisons/charts in Phase 2, and interpreted insights/neglect/stagnation/suggested priorities in Phase 3. “Strongest dimensions” is not implemented because no non-judgmental definition is available. The dashboard does not aggregate Streaks into a Current Self summary, and Health previews only the existing snapshot metrics. Neither is a closure blocker; both limitations and their disposition are recorded in the matrix.

The local SQLite-WASM database stored in IndexedDB and exported SQLite backups are not encrypted by Atlas. Local-first storage and export/import/reset support user control but do not provide encryption or comprehensive data-at-rest protection. Application-level encryption and key management remain a future security enhancement; no rushed encryption change or schema migration was introduced during closure.

Windows Narrator is installed in the environment, but the available browser/terminal tools do not expose its spoken output through audio capture or a transcript interface. Therefore, a genuine screen-reader session was not completed and is not claimed. Keyboard navigation/focus, browser accessibility-tree semantics, reduced-motion behavior, and responsive layouts were checked separately. No critical accessibility or responsive defect remained. Phase 2 and Phase 3 were not started; no commit or push was made.
