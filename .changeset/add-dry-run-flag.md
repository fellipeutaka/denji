---
"denji": minor
---

Add `--dry-run` flag to `denji add` command

Preview what would be generated without writing any files to disk. Useful for CI checks, pull request previews, or verifying icon names before committing changes.

**Usage:**

```sh
denji add lucide:check mdi:home --dry-run
```

**Example output:**

```
◇ denji add
│
○ [dry-run] Would add Check → ./src/icons.tsx
○ [dry-run] Would add Home → ./src/icons.tsx
│
◇ Dry run complete — 2 icon(s) previewed, no files written
```

**Behavior:**

- No files are created or modified
- Pre/post hooks are not executed
- All other validations still run (icon name format, `allowedLibraries`, config loading)
- Indicates whether each icon would be **added** (new) or **replaced** (already exists)
