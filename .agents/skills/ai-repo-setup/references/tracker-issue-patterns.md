# Tracker Issue Patterns

Patterns for creating well-structured issues in external trackers (Linear, Jira,
GitHub Issues, etc.) when bulk-creating from requirements docs.

## Pre-flight checklist

Before creating any issues, confirm these with the user:

1. **Scope split** — one issue per requirement per scope (API, web, mobile), or
   combined into a single issue? Default recommendation: split per scope.
2. **Label taxonomy** — ask the user to define (or confirm) the label structure
   before creating anything. Example categories: feature area (`auth`,
   `payments`), requirement type (`functional`, `non-functional`,
   `business-rule`), scope (`api`, `web`, `mobile`).
3. **Stakeholder docs** — ask if the user wants REQUIREMENTS.md and
   BUSINESS-RULES.md content mirrored as project documents in the tracker (e.g.,
   Linear's Resources tab) for non-dev stakeholders (Scrum Masters, PMs) who
   don't access the codebase. If yes, create them.

## Patterns

### One issue per requirement per scope

Never mix API, web, and mobile tasks in a single issue. Each scope gets its own
issue for the same requirement, enabling independent assignment, tracking, and
completion.

Bad — one mega-issue:

```
FR-012: Browse events
- [ ] Public events list endpoint (API)
- [ ] Events listing page (Web)
- [ ] Events listing screen (Mobile)
```

Good — three separate issues:

```
FR-012: Browse events — API
- [ ] Public events list endpoint (no auth, cursor-based pagination)
- [ ] Event detail endpoint (public)
- [ ] Filter by date range, venue, status

FR-012: Browse events — Web
- [ ] Events listing page (public, SSR)
- [ ] Event detail page with SEO/OG tags
- [ ] Search and filter UI

FR-012: Browse events — Mobile
- [ ] Events listing screen (infinite scroll)
- [ ] Event detail screen
- [ ] Search and filter UI
```

Each issue is independently assignable, trackable, and closeable.

### Native task format

Always use the tracker's native task/checkbox format for task lists within
issues. Never use plain bullet points for actionable items.

Bad:

```
- Public events list endpoint
- Event detail endpoint
- Filter by date range
```

Good:

```
- [ ] Public events list endpoint
- [ ] Event detail endpoint
- [ ] Filter by date range
```

Checkboxes give progress tracking, completion percentage, and visual feedback
that bullet points don't.

### Dependency linking

After creating issues, link dependencies using the tracker's native issue
linking (blocks/blocked-by, parent/sub-issue, related). Use resolved issue IDs,
not string references.

Bad — string reference:

```
## Dependencies
* event-crud
```

Good — tracker-native link:

```
## Dependencies
Blocked by BB-042 (Event CRUD)
```

Create all issues first, then wire up dependency links using the resolved IDs.
This lets the tracker enforce ordering, visualize the dependency graph, and warn
about blocked work.

### Label strategy

Apply the label taxonomy confirmed in the pre-flight checklist. Typical
structure:

- **Feature area**: `auth`, `events`, `payments`, `notifications`
- **Requirement type**: `functional`, `non-functional`, `business-rule`
- **Scope**: `api`, `web`, `mobile` (if splitting issues per scope)

Create all labels before creating issues (batch label creation), then apply them
consistently. Don't invent new labels mid-creation without confirming with the
user.

### Stakeholder docs

If the user confirmed in the pre-flight checklist, create project-level
documents in the tracker mirroring the repo docs:

- One document for REQUIREMENTS.md content
- One document for BUSINESS-RULES.md content

These serve as reference for stakeholders who browse the tracker but don't have
access to (or don't navigate) the codebase. Keep them as a snapshot — the repo
docs remain the source of truth for content; the tracker is the source of truth
for status.
