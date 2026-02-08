---
"denji": minor
---

Add Svelte framework support and folder output mode

- Add folder output mode: `output` config accepts `{ type: "folder", path: "..." }` for multi-file icon generation
- Add `--output-type <file|folder>` CLI flag to init command
- Add Svelte strategy: generates native `.svelte` components using Svelte 5 `$props()` runes
- Backward compatible: legacy string `output` normalized to `{ type: "file", path: "..." }`
