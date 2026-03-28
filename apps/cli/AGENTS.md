# Denji CLI

CLI for managing SVG icons in React/Preact/Solid/Vue/Svelte/Qwik projects. Fetches from Iconify, converts to framework-specific components.

## Eta Templates

Templates are **inline strings** in each strategy file (not separate `.eta` files) — required for bundled builds:

```typescript
import { eta } from "~/utils/eta";

const TEMPLATE = `<% if (it.typescript) { -%>...<%- } -%>`;
eta.loadTemplate("@react/icons", TEMPLATE);
eta.render("@react/icons", { typescript, forwardRef });
```

## Testing

Tests use constructor-injected mock deps — no module-level mocking:

```typescript
const deps = createListDeps({
  fs: createMockFs({ readFile: mock(() => Promise.resolve(new Ok("..."))) }),
  config: withConfig({ output: { type: "file", path: "./icons.tsx" } }),
});
const result = await new ListCommand(deps).run({ cwd: "/test" });
```

Mock factories live in `src/commands/__tests__/test-utils.ts`. Test configs must use `OutputConfig` object shape, not bare string.
