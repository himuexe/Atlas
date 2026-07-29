# CONTRIBUTING.md

# Contributing to Atlas

First of all, thank you for taking the time to contribute to Atlas.

Although Atlas started as a personal project, it is designed to be built with the same engineering discipline expected in professional software teams.

This document defines the workflow used throughout the project.

---

# Development Philosophy

Atlas is built with one simple principle:

> Build slowly. Build correctly.

The objective is not to ship the most code.

The objective is to ship maintainable software.

Every feature should improve the project rather than simply making it larger.

---

# Before You Write Code

Before implementing any feature, answer the following questions.

- Why is this feature needed?
- Does it align with Atlas' philosophy?
- Is there a simpler solution?
- Will this still make sense six months from now?

If the answer is "no", reconsider the implementation.

---

# Development Workflow

Every feature should follow the same process.

## 1. Understand

Understand the problem completely.

Avoid coding before the problem is clear.

---

## 2. Design

Discuss architecture.

Consider alternatives.

Evaluate trade-offs.

---

## 3. Implement

Write clean, readable code.

Avoid premature optimization.

---

## 4. Verify

Test the feature.

Check for regressions.

Review the implementation.

---

## 5. Commit

Create a meaningful Git commit.

One logical change per commit.

---

# Git Branch Strategy

The `main` branch should always remain stable.

Development should happen in feature branches.

Example:

```text
main
│
├── feature/dashboard
├── feature/journal
├── feature/health
├── feature/settings
└── feature/streaks
```

Bug fixes should use:

```text
fix/...
```

Refactoring should use:

```text
refactor/...
```

Documentation updates should use:

```text
docs/...
```

---

# Commit Message Convention

Follow Conventional Commits whenever possible.

Examples:

```text
feat: add dashboard layout

feat: implement journal editor

fix: resolve sidebar routing

refactor: simplify focus state management

style: improve spacing on dashboard

docs: update architecture guide

test: add dashboard component tests
```

Avoid messages like:

```text
updated

changes

fixed stuff

final

done
```

---

# Code Style

The codebase values readability over cleverness.

Guidelines:

- Use meaningful variable names.
- Keep components focused.
- Prefer composition over inheritance.
- Avoid unnecessary abstractions.
- Avoid deeply nested logic.
- Remove unused code.
- Prefer explicitness over magic.

---

# TypeScript

Atlas is a TypeScript-first project.

Rules:

- Avoid `any`.
- Prefer interfaces for public objects.
- Use strict typing.
- Keep types readable.
- Simplify overly complex generics.

---

# React

Prefer:

- Functional Components
- Hooks
- Small reusable components
- Controlled components
- Predictable state

Avoid:

- Giant components
- Prop drilling
- Duplicate state
- Unnecessary memoization

---

# Styling

Atlas uses Tailwind CSS.

Guidelines:

- Keep utility classes readable.
- Extract repeated UI into reusable components.
- Maintain consistent spacing.
- Maintain typography hierarchy.

Avoid inline styles whenever possible.

---

# Dependencies

Before adding a dependency ask:

1. Why do we need it?
2. Can existing tools solve the problem?
3. Is it actively maintained?
4. Does it increase complexity?

Dependencies should solve problems—not create them.

---

# Documentation

Documentation is part of the project.

Whenever architecture changes:

Update the documentation.

Whenever workflows change:

Update the documentation.

Whenever major decisions are made:

Record them.

---

# Pull Requests

Every pull request should:

- Have a clear purpose.
- Stay focused on one feature.
- Include documentation updates if needed.
- Be reviewed before merging.

Small pull requests are preferred over massive ones.

---

# Engineering Principles

Always prioritize:

- Simplicity
- Maintainability
- Scalability
- Accessibility
- Performance
- Developer Experience

---

# Final Reminder

Code is temporary.

Architecture lasts much longer.

Write software that your future self will enjoy maintaining.