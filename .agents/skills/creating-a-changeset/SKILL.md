# Creating Changesets (LLM Guide)

This guide is specifically for LLMs (like Claude Code) to help generate changesets for the Denji project.

## When to Create a Changeset

Create a changeset for user-facing changes:
- ✅ New features
- ✅ Bug fixes  
- ✅ Breaking changes
- ✅ Performance improvements
- ✅ User-facing documentation changes
- ❌ Internal refactoring (no user impact)
- ❌ Test-only changes
- ❌ CI/CD configuration

## How to Create a Changeset (Manual Method)

Since `bun changeset` is an interactive CLI tool (not suitable for LLMs), create changeset files manually:

### File Location
Create a new file in `.changeset/` directory with a descriptive kebab-case name:
```
.changeset/add-forward-ref-option.md
.changeset/fix-icon-name-collision.md
.changeset/breaking-change-config-schema.md
```

### File Format

```markdown
---
"denji": <change-type>
---

<Short summary (one line)>

<Detailed description with examples and migration guides if needed>
```

### Change Types (Semantic Versioning)

- **`patch`** - Bug fixes, minor improvements, no API changes
  - Version bump: `0.2.0` → `0.2.1`
  - Example: "Fix icon name sanitization for special characters"

- **`minor`** - New features, backward-compatible additions
  - Version bump: `0.2.0` → `0.3.0`
  - Example: "Add forwardRef option for React components"

- **`major`** - Breaking changes, API removals/changes
  - Version bump: `0.2.0` → `1.0.0`
  - Example: "Remove support for Node.js 14"

## Changeset Template

### For Minor Changes (New Features)

```markdown
---
"denji": minor
---

Add `featureName` option

This release introduces a new `featureName` configuration option that allows users to [describe benefit].

**New Configuration:**

- `config.featureName` - [description] (defaults to `[value]`)
- CLI flags: `--feature-name` / `--no-feature-name` for `init` command

**Example:**

\`\`\`json
{
  "framework": "react",
  "featureName": true
}
\`\`\`

**Usage:**

\`\`\`tsx
// Example code showing the feature in action
\`\`\`
```

### For Patch Changes (Bug Fixes)

```markdown
---
"denji": patch
---

Fix [specific issue description]

Resolves an issue where [describe the bug]. The [component/feature] now correctly [describe fix].

**Before:**
\`\`\`tsx
// Code showing the bug
\`\`\`

**After:**
\`\`\`tsx
// Code showing the fix
\`\`\`

Fixes #[issue-number] (if applicable)
```

### For Major Changes (Breaking Changes)

```markdown
---
"denji": major
---

BREAKING: [Change description]

This is a breaking change that [explain what changed and why].

**Migration Guide:**

**Before:**
\`\`\`tsx
// Old API usage
\`\`\`

**After:**
\`\`\`tsx
// New API usage
\`\`\`

**Breaking Changes:**
- [List each breaking change]
- [Explain how to migrate]

**Rationale:**
[Explain why this breaking change was necessary]
```

## Real-World Examples

### Example 1: New Feature (forwardRef)

```markdown
---
"denji": minor
---

Add `forwardRef` option for React icon components

This release adds a new `forwardRef` configuration option for React projects that wraps icon components with `React.forwardRef`, enabling ref forwarding to the underlying SVG element.

**New Configuration Options:**

- `react.forwardRef` - Boolean option to enable forwardRef wrapping (defaults to `false`)
- CLI flags: `--forward-ref` / `--no-forward-ref` for the `init` command

**Changes:**

- Enhanced config schema with framework-specific options using discriminated unions
- Added interactive prompt during `denji init` for React projects
- Updated TypeScript types to reflect `ForwardRefExoticComponent` when enabled
- Framework-agnostic architecture that supports future framework-specific options

**Example Configuration:**

\`\`\`json
{
  "framework": "react",
  "output": "./src/icons.tsx",
  "react": {
    "forwardRef": true
  }
}
\`\`\`

**Usage:**

\`\`\`tsx
import { useRef } from "react";
import { Icons } from "./icons";

function App() {
  const iconRef = useRef<SVGSVGElement>(null);
  return <Icons.Check ref={iconRef} className="size-4" />;
}
\`\`\`
```

### Example 2: Bug Fix

```markdown
---
"denji": patch
---

Fix icon name collision when adding icons with same base name

Resolves an issue where adding icons like `lucide:check` and `mdi:check` would overwrite each other. Icon names now include the collection prefix to prevent collisions.

**Before:**
Both icons would be named `Check`, causing the second to override the first.

**After:**
Icons are named `LucideCheck` and `MdiCheck` respectively.

Fixes #42
```

### Example 3: Performance Improvement

```markdown
---
"denji": patch
---

Improve icon generation performance by 40%

Optimized SVG parsing and template generation to significantly reduce build times for projects with many icons. Large icon sets (100+ icons) now generate ~40% faster.

**Technical Details:**
- Parallelized icon fetching from Iconify API
- Cached parsed SVG structures
- Reduced redundant file system operations
```

## Best Practices for LLMs

1. **Always analyze git diff** to understand the full scope of changes
2. **Choose the correct semver type**:
   - Breaking change? → `major`
   - New feature? → `minor`
   - Bug fix or small improvement? → `patch`
3. **Write user-focused descriptions** (avoid implementation details unless relevant)
4. **Include code examples** when changes affect API usage
5. **Use descriptive filenames** that match the change (e.g., `add-forward-ref-option.md`)
6. **Format code blocks properly** using triple backticks with language hints
7. **Reference issues/PRs** when applicable using `Fixes #123` or `Closes #456`

## What NOT to Include

- Internal refactoring details (unless user-facing)
- Test implementation specifics
- Build system changes
- Development tooling updates
- Overly technical jargon

## Publishing

**DO NOT** include `bun changeset publish` commands or instructions. Publishing is automated via GitHub Actions when changes are pushed to main.

The workflow:
1. LLM creates changeset file → `.changeset/feature-name.md`
2. User commits and pushes to main
3. GitHub Actions automatically versions and publishes

## Validation Checklist

Before creating a changeset, verify:
- [ ] File is in `.changeset/` directory
- [ ] Filename is descriptive and kebab-case
- [ ] YAML frontmatter is correct: `"denji": minor`
- [ ] Summary is clear and user-focused
- [ ] Code examples are properly formatted
- [ ] Semver type matches the change scope
- [ ] No implementation details that don't affect users