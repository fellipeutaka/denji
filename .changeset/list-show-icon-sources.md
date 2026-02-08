---
"denji": minor
---

Show icon sources in `list` command when `trackSource` is enabled

The `denji list` command now displays the original Iconify source name (e.g., `lucide:check`) for each icon when `trackSource` is enabled. This makes it easier to identify which icon collection each icon comes from and helps track icons that were manually modified.

**Key Features:**

- Shows source information next to icon names: `• Check (lucide:check)`
- Indicates icons without source tracking: `• Pencil (⚠️  Unknown)`
- Respects `trackSource` configuration setting
- Supports both formatted and JSON output modes

**Example Output (trackSource enabled):**

```
denji list
Found 3 icon(s) in ./src/icons

Icons:
  • Check (lucide:check)
  • Eye (lucide:eye)
  • Pencil (⚠️  Unknown)
│
└  Done
```

**Example Output (trackSource disabled):**

```
denji list
Found 3 icon(s) in ./src/icons

Icons:
  • Check
  • Eye
  • Pencil
│
└  Done
```

**JSON Output (trackSource enabled):**

```json
{
  "count": 3,
  "output": "./src/icons.tsx",
  "icons": [
    { "name": "Check", "source": "lucide:check" },
    { "name": "Eye", "source": "lucide:eye" },
    { "name": "Pencil", "source": null }
  ]
}
```

**JSON Output (trackSource disabled):**

```json
{
  "count": 3,
  "output": "./src/icons.tsx",
  "icons": ["Check", "Eye", "Pencil"]
}
```

The source information is automatically extracted from the `data-icon` attribute that Denji adds to SVG elements when `trackSource` is enabled. Icons showing "Unknown" either had their `data-icon` attribute manually removed or were added before enabling source tracking.
