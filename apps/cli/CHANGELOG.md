# denji

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
