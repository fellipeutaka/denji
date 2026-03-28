---
"denji": minor
---

Add `allowedLibraries` option to restrict icon sources

This release introduces a new `allowedLibraries` configuration option that locks your project to specific Iconify prefixes. Any attempt to add an icon from an unlisted library will fail with a clear error.

**New Configuration:**

- `allowedLibraries` - Array of allowed Iconify prefixes (e.g., `["lucide"]`). When omitted or empty, all libraries are allowed.

**Example:**

```json
{
  "framework": "react",
  "output": "./src/icons.tsx",
  "allowedLibraries": ["lucide"]
}
```

**Usage:**

```sh
# Allowed
denji add lucide:check

# Rejected
denji add mdi:home
# Error: Icon "mdi:home" is not allowed. Allowed libraries: lucide
```
