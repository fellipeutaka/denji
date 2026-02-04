# Denji CLI

CLI for managing SVG icons in React/Preact projects. Fetches from Iconify, converts to components.

## Architecture

### Strategy + Factory Pattern

Framework-specific logic is encapsulated in strategies:

```
src/frameworks/
  types.ts          # FrameworkStrategy interface
  factory.ts        # createFrameworkStrategy(name) - dynamic import
  registry.ts       # Framework metadata for prompts
  react/
    schema.ts       # Zod Mini schema for react options
    strategy.ts     # FrameworkStrategy implementation
  preact/
    schema.ts
    strategy.ts
```

### Key Interface

```typescript
interface FrameworkStrategy {
  name: string;
  fileExtensions: { typescript: string; javascript: string };
  optionsSchema: ZodMiniType;
  supportsRef: boolean;
  getIconsTemplate(config: TemplateConfig): string;
  getImports(options: FrameworkOptions): string[];
  getForwardRefImportSource(): string;
  isForwardRefEnabled(options: FrameworkOptions): boolean;
  promptOptions(context: PromptContext): Promise<FrameworkOptions>;
  getConfigKey(): string;
}
```

### Adding a New Framework

1. Create `src/frameworks/<name>/schema.ts` with Zod Mini options schema
2. Create `src/frameworks/<name>/strategy.ts` implementing `FrameworkStrategy`
3. Add case to `src/frameworks/factory.ts` switch
4. Add entry to `src/frameworks/registry.ts`
5. Add discriminated union variant in `src/schemas/config.ts`
6. Update `frameworkSchema` enum in `src/schemas/config.ts`

### Commands

All commands use the factory pattern:
- `init.ts` - Creates config + icons file using strategy template
- `add.ts` - Adds icons, uses strategy for forwardRef detection
- `remove.ts` - Removes icons, resets to strategy template when empty
- `clear.ts` - Resets to strategy template

### Config Schema

Discriminated union on `framework` field:
- Base config (output, typescript, a11y, trackSource, hooks)
- Framework-specific options (`react.forwardRef`, `preact.forwardRef`, etc.)

## Zod Mini

References:
- Docs: https://raw.githubusercontent.com/colinhacks/zod/refs/heads/main/packages/docs/content/packages/mini.mdx
- Context7: Use `mcp__context7__resolve-library-id` with `libraryName: "zod"` then `mcp__context7__query-docs`

Use `zod/mini` with **named imports** for tree-shaking:

```typescript
// DO
import { object, string, boolean, _default, describe } from "zod/mini";

// DON'T
import * as z from "zod/mini";
```

### API differences from regular Zod

| Regular Zod | Zod Mini |
|-------------|----------|
| `z.string().optional()` | `optional(string())` |
| `z.boolean().default(false)` | `_default(boolean(), false)` |
| `schema.describe("...")` | `schema.check(describe("..."))` |
| `z.enum([...])` | `enum as zodEnum` (reserved word) |
| `schema1.and(schema2)` | `intersection(schema1, schema2)` |
| `schema1.or(schema2)` | `union([schema1, schema2])` |
| `z.object({}).partial()` | `partial(object({}))` |

## Testing

```bash
bun test
```

Tests mock fs/config modules. Strategy templates are tested via integration tests.

## Future: Eta Templates (Phase 2)

Plan to migrate string templates to `.eta` files for better maintainability with 8+ frameworks.
