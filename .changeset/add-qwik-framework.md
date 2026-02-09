---
"denji": minor
---

Add Qwik framework support

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
  Check: (props) => (<svg {...props}>...</svg>),
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
