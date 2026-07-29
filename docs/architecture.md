# Atlas Architecture

## Overview

Atlas is a **Personal Operating System** designed around one central philosophy:

> Reduce the friction between who the user is today and who they want to become.

The architecture emphasizes simplicity, maintainability, and long-term scalability.

Rather than designing for every possible feature today, Atlas grows incrementally while preserving a clean structure.

---

# Architectural Goals

Atlas is designed to be:

- Local-first
- Offline-friendly
- Modular
- Easy to understand
- Easy to extend
- Easy to test

Every architectural decision should support these goals.

---

# High-Level Architecture

```text
User
 │
 ▼
React Application
 │
 ▼
React Router
 │
 ▼
Feature Modules
 │
 ▼
Reusable Components
 │
 ▼
State Management
 │
 ▼
Persistence Layer
 │
 ▼
Local Database
```

Initially, only the first five layers will exist.

The persistence layer will be introduced after Version 1.

---

# Project Structure

```text
src
│
├── assets/
├── components/
│   ├── layout/
│   └── ui/
│
├── features/
│   ├── dashboard/
│   ├── health/
│   ├── journal/
│   ├── settings/
│   └── streaks/
│
├── hooks/
├── lib/
├── pages/
├── types/
├── utils/
└── main.tsx
```

---

# Architectural Layers

## Layout Layer

Responsible for application structure.

Examples:

- Sidebar
- Top Navigation
- App Shell

This layer should never contain business logic.

---

## UI Layer

Reusable interface components.

Examples:

- Card
- Button
- Input
- Dialog
- Badge

These components should remain generic.

---

## Feature Layer

Business logic belongs here.

Each feature should own:

- Components
- Hooks
- Types
- Utilities
- Services

Example:

```text
features/
    dashboard/
        components/
        hooks/
        types/
        utils/
```

Feature code should not leak into other features.

---

## State Layer

State should evolve gradually.

Preferred progression:

Local Component State

↓

Context

↓

Zustand (if necessary)

↓

Persistent Storage

↓

Synchronization

Avoid introducing global state before it is required.

---

## Data Layer

Initially:

Static mock data.

Later:

SQLite.

Eventually:

Optional cloud synchronization.

The application should remain fully functional offline.

---

# Routing

React Router is responsible for navigation.

Each page should be responsible only for layout and composition.

Business logic should remain inside feature modules.

---

# Component Philosophy

Components should be:

Small.

Focused.

Reusable.

Easy to test.

A component should have a single responsibility.

---

# Folder Responsibilities

## components/

Shared reusable UI.

## features/

Feature-specific code.

## hooks/

Reusable custom hooks.

## lib/

Utility functions and shared helpers.

## types/

Shared TypeScript types.

## pages/

Route entry points.

---

# Data Flow

The preferred data flow is:

```text
Data
 │
 ▼
State
 │
 ▼
Components
 │
 ▼
User Interaction
 │
 ▼
State Update
 │
 ▼
UI Re-render
```

Keep data flow predictable and unidirectional.

---

# Design Principles

Atlas follows several design principles.

## Simplicity

Choose the simplest solution that satisfies the requirement.

---

## Composition

Build larger features from smaller components.

Avoid inheritance.

---

## Scalability

Structure code so future features fit naturally without major refactoring.

---

## Consistency

Maintain consistent naming.

Maintain consistent folder organization.

Maintain consistent coding patterns.

---

# Future Architecture

As Atlas grows, the following layers may be introduced:

- SQLite persistence
- Background synchronization
- AI services
- Import/Export
- Plugin architecture
- Calendar integration

These additions should not require significant changes to existing feature modules.

---

# Non-Goals

Atlas intentionally avoids:

- Microservices
- Over-engineering
- Complex state management
- Excessive abstractions
- Premature optimization

Complexity should only be introduced when justified by real requirements.

---

# Architectural Principle

Before introducing any new architecture, ask:

1. Does this solve a real problem?
2. Is it simpler than the alternatives?
3. Will future developers understand it?
4. Does it align with Atlas' philosophy?

If not, rethink the solution.

---

# Final Thought

Good architecture is not about preparing for every possible future.

It is about making today's decisions in a way that keeps tomorrow's options open.