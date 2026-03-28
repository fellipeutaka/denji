# Multi-Layer Project Guide

When to use layered context docs and how to structure them for projects
with multiple deployment layers (backend, frontend, mobile, etc.).

## When to use this

Projects where the same requirements are implemented across multiple
independent layers (e.g. backend API + frontend SPA, mobile app, etc.)
that have separate codebases, separate agents, or separate teams.

## Problem

If a requirement like "filter students by date range" is half-implemented
(backend done, frontend not yet), a single status field in the root doc
misleads whichever layer reads it.

## Solution

Layered context docs that reference root docs by ID, never duplicating
descriptions. Root docs hold definitions + aggregated system-level status.
Context docs hold per-layer status + implementation scope.

```
docs/
  REQUIREMENTS.md         ← definitions + aggregated system-level status
  BUSINESS-RULES.md       ← definitions + aggregated system-level status
  backend/
    REQUIREMENTS.md       ← backend status + implementation notes per FR/NFR
    BUSINESS-RULES.md     ← backend-relevant rules + enforcement status
  frontend/
    REQUIREMENTS.md       ← frontend status + UI scope per FR/NFR
    BUSINESS-RULES.md     ← frontend-relevant rules + enforcement status
```

## Rules for context docs

- Each entry references the root doc ID (e.g. `FR-010`) and adds:
  - `**Status**` — implementation status for this layer only
  - `**Scope ([layer])**` — what specifically this layer is responsible for
- Never copy the requirement description — it lives in the root doc only
- Requirements with no responsibility in a layer are omitted from that
  layer's doc entirely (e.g. a pure-UI layout requirement doesn't appear in
  `docs/backend/REQUIREMENTS.md`)
- Business rules are split by where they are enforced: server-side validation
  goes to `backend/`, visual feedback and UI constraints go to `frontend/`

### Example: backend context doc

```markdown
#### FR-010: Filter students by date range
- **Status**: `implemented`
- **Scope (backend)**: `GET /students/search?startDate=&endDate=` — filters by
  `createdAt` (ISO 8601). Inclusive bounds. Combinable with other filters (AND).
```

### Example: frontend context doc

```markdown
#### FR-010: Filter students by date range
- **Status**: `refined`
- **Scope (frontend)**: Date range selector with calendar icon. "Start date"
  and "End date" fields. Removable chip "Period: MM/DD/YYYY–MM/DD/YYYY ×".
```

## Root doc status aggregation

**Status in root docs is aggregated** — it reflects the state of the system as
a whole, not any individual layer. An agent promotes the root doc status only
when all layer context docs have reached the same status level (e.g. both
backend and frontend are `implemented` → root becomes `implemented`).

## Monorepo layout

All layers live in the same repo. Root docs and all context docs coexist:

```
repo/
  docs/
    REQUIREMENTS.md
    BUSINESS-RULES.md
    backend/
      REQUIREMENTS.md
      BUSINESS-RULES.md
    frontend/
      REQUIREMENTS.md
      BUSINESS-RULES.md
  apps/
    backend/
      AGENTS.md   ← points to ../../docs/backend/ + ../../docs/
    frontend/
      AGENTS.md   ← points to ../../docs/frontend/ + ../../docs/
```

Each app package has its own `AGENTS.md` pointing to its context docs with
relative paths. Agents from different packages don't need to read each other's
context docs. Root docs are shared naturally since they're in the same repo.

## Separate repositories

Each layer lives in its own repo. The challenge is keeping root docs in sync.
Two viable approaches:

**A — Duplicate root docs**: copy `REQUIREMENTS.md` and `BUSINESS-RULES.md`
into each repo. Simple, but requires manual sync when definitions change. Works
well when requirements are stable and layers change independently.

```
backend-repo/
  docs/
    REQUIREMENTS.md      ← copy of shared root doc
    BUSINESS-RULES.md    ← copy of shared root doc
    backend/
      REQUIREMENTS.md
      BUSINESS-RULES.md
  AGENTS.md

frontend-repo/
  docs/
    REQUIREMENTS.md      ← copy of shared root doc
    BUSINESS-RULES.md    ← copy of shared root doc
    frontend/
      REQUIREMENTS.md
      BUSINESS-RULES.md
  AGENTS.md
```

**B — Dedicated docs repo**: root docs live in a separate `[project]-docs` repo.
Each layer repo references it as a git submodule or fetches it in CI.

```
project-docs/            ← dedicated repo, owned by product/design
  REQUIREMENTS.md
  BUSINESS-RULES.md

backend-repo/
  docs -> ../project-docs (submodule)
  docs/backend/
    REQUIREMENTS.md
    BUSINESS-RULES.md

frontend-repo/
  docs -> ../project-docs (submodule)
  docs/frontend/
    REQUIREMENTS.md
    BUSINESS-RULES.md
```

Prefer **A** for small teams or stable requirements. Prefer **B** when
definitions change frequently or multiple teams need to stay in sync.

## Agent workflow with layered docs

- Agents read their own context doc + root docs for definitions.
- Agents update status only in their own context doc.
- After updating a layer's status to `implemented` or `verified`, the agent
  checks if all other layer context docs are at the same level. If yes, it
  also promotes the root doc status to match. If no, it leaves the root doc
  unchanged.

## AGENTS.md example

Example for a multi-layer project (backend agent):

```markdown
# Project Name — Backend API

REST API for a student management platform.

## Docs

- `docs/REQUIREMENTS.md` — full requirement definitions + aggregated system-level status
- `docs/BUSINESS-RULES.md` — full business rule definitions + aggregated system-level status
- `docs/backend/REQUIREMENTS.md` — backend implementation status per requirement + scoped notes
- `docs/backend/BUSINESS-RULES.md` — backend-relevant rules + enforcement status

When implementing features or fixing bugs, update the status in `docs/backend/`.
Promote the root doc status only when all layers reach the same status level.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, list any unresolved questions that need answering before proceeding.
```
