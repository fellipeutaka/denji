---
"denji": minor
---

Add Solid.js framework support

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
  Check: (props) => (<svg {...props}>...</svg>),
  Home: (props) => (<svg {...props}>...</svg>),
} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
```

**Key Differences from React/Preact:**

- No `forwardRef` option needed - Solid refs work natively as props
- Uses native HTML attributes (kebab-case) instead of React's camelCase
- Optimized for Solid's fine-grained reactivity
