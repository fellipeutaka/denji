---
"denji": minor
---

Add `denji export` and `denji import` commands for snapshot and bulk add

This release introduces two new commands for auditing and migrating icons across projects.

## `denji export`

Exports a JSON manifest of all icons currently tracked in your project.

**Usage:**

```sh
# Print to stdout
denji export

# Write to a file
denji export --output icons.json

# Write to default file (denji-export.json)
denji export --output
```

**Output format:**

```json
{
  "version": 1,
  "framework": "react",
  "output": "./src/icons.tsx",
  "icons": [
    { "name": "Home", "source": "mdi:home" },
    { "name": "Check", "source": "lucide:check" }
  ]
}
```

The `source` field is included only when `trackSource: true` (the default) and the icon was added via `denji add`.

## `denji import`

Bulk-adds icons from a manifest JSON file, a plain text file (one `prefix:name` per line), or stdin.

**Usage:**

```sh
# From a JSON manifest (e.g. produced by denji export)
denji import icons.json

# From a plain text file
denji import icons.txt

# From stdin
echo "mdi:home\nlucide:check" | denji import

# Dry run (preview without writing)
denji import icons.json --dry-run
```

Icons without a valid `prefix:name` format are skipped with a warning. JSON manifest entries without a `source` field are also skipped.
