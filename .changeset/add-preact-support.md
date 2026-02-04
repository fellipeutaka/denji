---
"denji": minor
---

Add Preact framework support

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
export type Icon = preact.ForwardRefExoticComponent<IconProps & preact.RefAttributes<SVGSVGElement>>;

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
