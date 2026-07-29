# Architecture Decision Records (ADR)

This document records significant architectural decisions made during the development of Atlas.

The purpose of these records is to document **why** a decision was made—not just **what** was implemented.

Future contributors (human or AI) should consult this document before making significant architectural changes.

---

# Decision Template

```markdown
## ADR-XXX

Date:

Status:
(Proposed | Accepted | Deprecated | Superseded)

Decision

Context

Alternatives Considered

Consequences

Notes
```

---

# ADR-001

## Project Philosophy

**Status:** Accepted

### Decision

Atlas will be developed as a **Personal Operating System**, not as a productivity application or habit tracker.

### Context

Most existing productivity tools encourage users to add more information, more metrics, and more complexity.

Atlas aims to reduce cognitive load instead.

### Consequences

Every future feature must support the philosophy of reducing mental friction.

Features that increase complexity without meaningful benefit should not be added.

---

# ADR-002

## Local First

**Status:** Accepted

### Decision

Atlas will prioritize local storage.

Cloud synchronization will always remain optional.

### Context

Users should own their data.

The application should continue working without internet access.

### Consequences

Persistence architecture should assume offline availability.

---

# ADR-003

## Technology Stack

**Status:** Accepted

### Decision

Atlas uses:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- shadcn/ui

### Context

These technologies provide an excellent balance between performance, maintainability, and ecosystem maturity.

### Alternatives

Next.js

Remix

Svelte

Vue

### Consequences

The application remains lightweight while supporting future growth.

---

# ADR-004

## State Management

**Status:** Accepted

### Decision

State management should evolve gradually.

Progression:

Local State

↓

React Context

↓

Zustand (only if necessary)

### Context

Introducing global state too early creates unnecessary complexity.

### Consequences

Keep state as close as possible to where it is used.

---

# ADR-005

## Feature Organization

**Status:** Accepted

### Decision

Business logic belongs inside feature folders.

Shared UI belongs inside shared component folders.

### Context

Organizing by feature scales better than organizing by file type.

### Consequences

Future code should follow feature-first organization.

---

# ADR-006

## AI Collaboration

**Status:** Accepted

### Decision

AI assistants are collaborators—not autonomous developers.

### Context

The project exists partly as a learning journey.

AI should explain architectural decisions instead of simply generating code.

### Consequences

Future AI interactions should prioritize teaching, discussion, and reasoning.

---

# Future Decisions

Every significant architectural change should receive a new ADR.

Examples:

- Database selection
- State management changes
- Routing changes
- Authentication
- AI integration
- Plugin architecture
- Mobile support

Document decisions before implementation whenever practical.