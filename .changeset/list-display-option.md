---
"denji": major
---

BREAKING: Replace `--json` flag with `--display` option on `list` command

The `--json` flag has been removed in favor of a new `--display <mode>` option that supports three output modes: `default`, `json`, and `toon`.

**Migration Guide:**

**Before:**

```sh
denji list --json
```

**After:**

```sh
denji list --display json
```

**New `--display` modes:**

- `default` — Human-readable formatted output (unchanged behavior, this is the default)
- `json` — Structured JSON output (replaces `--json`)
- `toon` — [TOON format](https://github.com/toon-format/toon) output for machine-readable binary encoding

**Example — TOON output:**

```sh
denji list --display toon
```

**Breaking Changes:**

- `--json` flag removed; use `--display json` instead
