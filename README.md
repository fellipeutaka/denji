# Denji

CLI tool for managing SVG icons in React projects. Fetches icons from Iconify, converts to optimized React components, and maintains a centralized icons file.

## Installation

```bash
bun add -D denji
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
    "postAdd": ["bunx biome check --write ./src/icons.tsx"]
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `output` | `string` | - | Output file path (e.g., `./src/icons.tsx`) |
| `framework` | `"react"` | - | Target framework |
| `typescript` | `boolean` | `true` | Generate TypeScript |
| `a11y` | `"hidden"` \| `"img"` \| `"title"` \| `"presentation"` \| `false` | - | SVG accessibility strategy |
| `hooks` | `object` | - | Lifecycle hooks |

### Accessibility Options

- `hidden` - Adds `aria-hidden="true"` (decorative icons)
- `img` - Adds `role="img"` with `aria-label`
- `title` - Adds `<title>` element inside SVG
- `presentation` - Adds `role="presentation"`
- `false` - No accessibility attributes

### Hooks

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

## Usage

```tsx
import { Icons } from "./icons";

function App() {
  return <Icons.Check className="size-4 text-green-500" />;
}
```

## License

MIT
