# Denji

CLI tool for managing SVG icons in frontend projects. Fetches icons from Iconify, converts to optimized components, and maintains a centralized icons file.

Supports **React**, **Preact**, **Solid**, and **Vue**.

## Documentation

Visit https://denji-docs.vercel.app/docs to view the full documentation.

## Installation

```bash
npm add -D denji
```

## Quick Start

```bash
# Initialize config
denji init

# Add icons
denji add lucide:check mdi:home

# List icons
denji list

# Remove icons
denji remove Check Home

# Clear all icons
denji clear
```

## Configuration

Create `denji.json`:

```json
{
  "$schema": "./node_modules/denji/configuration_schema.json",
  "output": "./src/icons.tsx",
  "framework": "react",
  "typescript": true,
  "a11y": "hidden",
  "hooks": {
    "postAdd": ["npx biome check --write ./src/icons.tsx"]
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `output` | `string` | - | Output file path (e.g., `./src/icons.tsx`) |
| `framework` | `"react"` \| `"preact"` \| `"solid"` \| `"vue"` | - | Target framework |
| `typescript` | `boolean` | `true` | Generate TypeScript |
| `a11y` | `"hidden"` \| `"img"` \| `"title"` \| `"presentation"` \| `false` | - | SVG accessibility strategy |
| `hooks` | `object` | - | Lifecycle hooks |

## Frameworks

### React

```bash
denji init --framework react
```

```json
{
  "framework": "react",
  "react": {
    "forwardRef": true
  }
}
```

**Usage:**

```tsx
import { Icons } from "./icons";

function App() {
  return <Icons.Check className="size-4 text-green-500" />;
}
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `react.forwardRef` | `boolean` | `false` | Wrap icons with `forwardRef` |

### Preact

```bash
denji init --framework preact
```

```json
{
  "framework": "preact",
  "preact": {
    "forwardRef": true
  }
}
```

**Usage:**

```tsx
import { Icons } from "./icons";

function App() {
  return <Icons.Check className="size-4 text-green-500" />;
}
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preact.forwardRef` | `boolean` | `false` | Wrap icons with `forwardRef` (uses `preact/compat`) |

### Solid

```bash
denji init --framework solid
```

```json
{
  "framework": "solid"
}
```

**Usage:**

```tsx
import { Icons } from "./icons";

function App() {
  return <Icons.Check class="size-4 text-green-500" />;
}
```

> Note: Solid uses `class` instead of `className`. Refs are passed as regular props - no `forwardRef` needed.

### Vue

```bash
denji init --framework vue
```

```json
{
  "framework": "vue"
}
```

**Usage:**

```vue
<script setup lang="ts">
import { Icons } from "./icons";
</script>

<template>
  <Icons.Check class="size-4 text-green-500" />
</template>
```

> Note: Vue icons use `h()` render functions as `FunctionalComponent` types. Uses `class` instead of `className`.

## Accessibility

| Strategy | Description |
|----------|-------------|
| `hidden` | Adds `aria-hidden="true"` (decorative icons) |
| `img` | Adds `role="img"` with `aria-label` |
| `title` | Adds `<title>` element inside SVG |
| `presentation` | Adds `role="presentation"` |
| `false` | No accessibility attributes |

## Hooks

Available hooks: `preAdd`, `postAdd`, `preRemove`, `postRemove`, `preClear`, `postClear`, `preList`, `postList`

## Commands

### `denji init`

Initialize a new project with config file and icons template.

```bash
denji init [--output <file>] [--framework <framework>] [--typescript] [--a11y <strategy>]
```

### `denji add <icons...>`

Add icons from Iconify. Uses `prefix:name` format.

```bash
denji add lucide:check mdi:home-outline
denji add lucide:star --name FavoriteStar
denji add lucide:check --a11y img
```

### `denji remove <icons...>`

Remove icons by component name.

```bash
denji remove Check Home
```

### `denji list`

List all icons in the project.

```bash
denji list
denji list --json
```

### `denji clear`

Remove all icons.

```bash
denji clear
denji clear --yes  # Skip confirmation
```

## License

MIT
