# Debouncing

Debouncing delays execution until activity stops for a specified `wait` period. Use for search inputs, resize handlers, and auto-save.

## Core API

- **Class**: `Debouncer` / `AsyncDebouncer`
- **Function**: `debounce()` / `asyncDebounce()`
- **React**: `useDebouncedCallback` / `useAsyncDebouncedCallback`

## Key Options

- `wait`: delay in ms (or function: `(debouncer) => number`)
- `leading`: execute on first call (default: `false`)
- `trailing`: execute after wait (default: `true`)
- `enabled`: enable/disable dynamically

## Examples

### ❌ Incorrect — using `debounce()` function in React

```tsx
import { debounce } from '@tanstack/pacer'

function Search() {
  // No cleanup on unmount, new instance every render
  const search = debounce((q: string) => fetchResults(q), { wait: 300 })
  return <input onChange={(e) => search(e.target.value)} />
}
```

### ✅ Correct — use React hook

```tsx
import { useDebouncedCallback } from '@tanstack/react-pacer'

function Search() {
  const search = useDebouncedCallback(
    (q: string) => fetchResults(q),
    { wait: 300 },
  )
  return <input onChange={(e) => search(e.target.value)} />
}
```

### ❌ Incorrect — expecting maxWait

```tsx
const search = useDebouncedCallback(fn, {
  wait: 300,
  maxWait: 1000, // Does not exist in TanStack Pacer
})
```

### ✅ Correct — use Throttler for guaranteed periodic execution

```tsx
// If you need guaranteed execution within a time window, use throttling
const search = useThrottledCallback(fn, { wait: 1000 })
```

## Leading vs Trailing

| Config | Behavior |
|--------|----------|
| `trailing: true` (default) | Executes after `wait` ms of inactivity |
| `leading: true, trailing: false` | Executes immediately, ignores until `wait` passes |
| `leading: true, trailing: true` | Executes immediately AND after last activity pause |

## Methods

- `flush()` — execute pending call immediately
- `cancel()` — cancel pending call
- `reset()` — reset to initial state
- `setOptions()` — update options at runtime
