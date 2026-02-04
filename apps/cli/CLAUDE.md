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
    schema.ts       # Zod schema for react options
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
  optionsSchema: ZodSchema;
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

1. Create `src/frameworks/<name>/schema.ts` with Zod options schema
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

## Testing

```bash
bun test
```

Tests mock fs/config modules. Strategy templates are tested via integration tests.

## Future: Eta Templates (Phase 2)

Plan to migrate string templates to `.eta` files for better maintainability with 8+ frameworks.
