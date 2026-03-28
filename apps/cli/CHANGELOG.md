# denji

## 1.0.0

### Major Changes

- 32785d1: BREAKING: Replace `--json` flag with `--display` option on `list` command

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

### Minor Changes

- 61de0e9: Add `allowedLibraries` option to restrict icon sources

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

- 11d7118: Add `--dry-run` flag to `denji add` command

  Preview what would be generated without writing any files to disk. Useful for CI checks, pull request previews, or verifying icon names before committing changes.

  **Usage:**

  ```sh
  denji add lucide:check mdi:home --dry-run
  ```

  **Example output:**

  ```
  ◇ denji add
  │
  ○ [dry-run] Would add Check → ./src/icons.tsx
  ○ [dry-run] Would add Home → ./src/icons.tsx
  │
  ◇ Dry run complete — 2 icon(s) previewed, no files written
  ```

  **Behavior:**

  - No files are created or modified
  - Pre/post hooks are not executed
  - All other validations still run (icon name format, `allowedLibraries`, config loading)
  - Indicates whether each icon would be **added** (new) or **replaced** (already exists)

- 7360242: Add `denji export` and `denji import` commands for snapshot and bulk add

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

## 0.4.0

### Minor Changes

- 70cfe08: Add Qwik framework support

  Denji now supports Qwik as a target framework for generating icon components. Qwik icons use native HTML attributes (kebab-case) and `PropsOf<"svg">` for typing.

  **Configuration:**

  ```json
  {
    "framework": "qwik",
    "output": "./src/icons.tsx",
    "typescript": true
  }
  ```

  **File mode** generates plain arrow functions:

  ```tsx
  import type { PropsOf } from "@builder.io/qwik";

  export type IconProps = PropsOf<"svg">;
  export type Icon = (props: IconProps) => JSX.Element;

  export const Icons = {
    Check: (props) => <svg {...props}>...</svg>,
  } as const satisfies Record<string, Icon>;
  ```

  **Folder mode** generates `component$()` wrapped exports:

  ```tsx
  import { component$ } from "@builder.io/qwik";
  import type { PropsOf } from "@builder.io/qwik";

  export type IconProps = PropsOf<"svg">;

  export const Check = component$<IconProps>((props) => {
    return <svg {...props}>...</svg>;
  });
  ```

  **Usage:**

  ```tsx
  import { component$ } from "@builder.io/qwik";
  import { Icons } from "./icons";

  export const App = component$(() => {
    return <Icons.Check class="size-4" />;
  });
  ```

- 45c7254: Add Svelte framework support and folder output mode

  - Add folder output mode: `output` config accepts `{ type: "folder", path: "..." }` for multi-file icon generation
  - Add `--output-type <file|folder>` CLI flag to init command
  - Add Svelte strategy: generates native `.svelte` components using Svelte 5 `$props()` runes
  - Backward compatible: legacy string `output` normalized to `{ type: "file", path: "..." }`

- 66b37f4: Add Vue framework support

  Implements Vue strategy using `h()` render functions for icon components. Generates `FunctionalComponent`-typed icons with `SVGAttributes` props.

  Closes #8

- 40fadb4: Show icon sources in `list` command when `trackSource` is enabled

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

## 0.3.0

### Minor Changes

- 908dd11: Add `forwardRef` option for React icon components

  This release adds a new `forwardRef` configuration option for React projects that wraps icon components with `React.forwardRef`, enabling ref forwarding to the underlying SVG element.

  **New Configuration Options:**

  - `react.forwardRef` - Boolean option to enable forwardRef wrapping (defaults to `false`)
  - CLI flags: `--forward-ref` / `--no-forward-ref` for the `init` command

  **Changes:**

  - Enhanced config schema with framework-specific options using discriminated unions
  - Added interactive prompt during `denji init` for React projects
  - Updated TypeScript types to reflect `ForwardRefExoticComponent` when enabled
  - Framework-agnostic architecture that supports future framework-specific options

  **Example Configuration:**

  ```json
  {
    "framework": "react",
    "output": "./src/icons.tsx",
    "react": {
      "forwardRef": true
    }
  }
  ```

- 44a1ba0: Add Preact framework support

  This release adds Preact as a supported framework, allowing Preact projects to use Denji for icon management.

  **New Configuration Options:**

  - `framework: "preact"` - Select Preact as target framework
  - `preact.forwardRef` - Wrap icons with `forwardRef` (uses `preact/compat`)

  **Example Configuration:**

  ```json
  {
    "framework": "preact",
    "output": "./src/icons.tsx",
    "preact": {
      "forwardRef": true
    }
  }
  ```

  **Generated Template (TypeScript):**

  ```tsx
  import type * as preact from "preact/compat";

  export type IconProps = preact.ComponentProps<"svg">;
  export type Icon = preact.ForwardRefExoticComponent<
    IconProps & preact.RefAttributes<SVGSVGElement>
  >;

  export const Icons = {} as const satisfies Record<string, Icon>;

  export type IconName = keyof typeof Icons;
  ```

  **Usage:**

  ```tsx
  import { useRef } from "preact/hooks";
  import { Icons } from "./icons";

  function App() {
    const iconRef = useRef<SVGSVGElement>(null);
    return <Icons.Check ref={iconRef} class="size-4" />;
  }
  ```

  **Notes:**

  - forwardRef uses `preact/compat` as it's the proper API for Preact 10
  - When Preact 11 releases, refs become props by default

- c158860: Add Solid.js framework support

  Denji now supports Solid.js projects alongside React and Preact. Generate type-safe icon components optimized for Solid's reactive system.

  **New Configuration:**

  ```json
  {
    "framework": "solid",
    "output": "./src/icons.tsx",
    "typescript": true
  }
  ```

  **Usage:**

  ```bash
  # Initialize a new Solid project
  denji init --framework solid

  # Add icons (works the same as React/Preact)
  denji add lucide:check lucide:home
  ```

  **Generated Output:**

  ```tsx
  import type { ComponentProps, JSX } from "solid-js";

  export type IconProps = ComponentProps<"svg">;
  export type Icon = (props: IconProps) => JSX.Element;

  export const Icons = {
    Check: (props) => <svg {...props}>...</svg>,
    Home: (props) => <svg {...props}>...</svg>,
  } as const satisfies Record<string, Icon>;

  export type IconName = keyof typeof Icons;
  ```

  **Key Differences from React/Preact:**

  - No `forwardRef` option needed - Solid refs work natively as props
  - Uses native HTML attributes (kebab-case) instead of React's camelCase
  - Optimized for Solid's fine-grained reactivity

## 0.2.0

### Minor Changes

- feat: add trackSource config to track Iconify source names via data-icon attribute

## 0.1.2

### Patch Changes

- fix component names starting with numbers (e.g., `svg-spinners:90-ring-with-bg` → `RingWithBg90`)

## 0.1.1

### Patch Changes

- set default $schema

## 0.1.0

### Minor Changes

- add all main commands
