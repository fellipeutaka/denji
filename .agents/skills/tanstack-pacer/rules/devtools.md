# Devtools

TanStack Pacer integrates with the unified TanStack Devtools for real-time monitoring of all utility instances.

## Setup

```bash
npm install -D @tanstack/react-devtools @tanstack/react-pacer-devtools
```

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { pacerDevtoolsPlugin } from '@tanstack/react-pacer-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools plugins={[pacerDevtoolsPlugin()]} />
    </>
  )
}
```

## Registering Utilities

Only utilities with a `key` option appear in devtools:

### ❌ Incorrect — utility invisible in devtools

```tsx
const debouncer = useDebouncer(fn, { wait: 300 })
```

### ✅ Correct — add key for devtools visibility

```tsx
const debouncer = useDebouncer(fn, {
  wait: 300,
  key: 'searchDebouncer',
})
```

## Production Builds

Devtools are development-only by default (no-op in production). To force inclusion:

```tsx
import { pacerDevtoolsPlugin } from '@tanstack/react-pacer-devtools/production'
```

## Combined with Other TanStack Devtools

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { pacerDevtoolsPlugin } from '@tanstack/react-pacer-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'

<TanStackDevtools
  plugins={[
    pacerDevtoolsPlugin(),
    { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> },
  ]}
/>
```
