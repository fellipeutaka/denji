# Hook Selection

TanStack Pacer provides 4 hook variants per utility. Choosing the wrong one leads to unnecessary complexity or missing features.

## Hook Variants

| Hook Pattern | Returns | Best For |
|-------------|---------|----------|
| `use[Utility]` | Instance | Full control, custom state, Subscribe component |
| `use[Utility]Callback` | Wrapped function | Simple event handlers (onClick, onChange) |
| `use[Utility]State` | `[value, setValue, instance]` | Controlled inputs, form state |
| `use[Utility]Value` | `[derivedValue, instance]` | Read-only derived values from props/state |

## Examples

### ❌ Incorrect — using core hook for simple callback

```tsx
function Search() {
  const debouncer = useDebouncer(
    (q: string) => fetchResults(q),
    { wait: 300 },
  )
  return <input onChange={(e) => debouncer.maybeExecute(e.target.value)} />
}
```

### ✅ Correct — use callback hook for simple wrapping

```tsx
function Search() {
  const search = useDebouncedCallback(
    (q: string) => fetchResults(q),
    { wait: 300 },
  )
  return <input onChange={(e) => search(e.target.value)} />
}
```

### ❌ Incorrect — manual state sync for debounced input

```tsx
function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedSearch = useDebouncedCallback(
    (q: string) => setQuery(q),
    { wait: 300 },
  )
  return <input onChange={(e) => debouncedSearch(e.target.value)} />
}
```

### ✅ Correct — use state hook for controlled inputs

```tsx
function SearchInput() {
  const [query, setQuery] = useDebouncedState('', { wait: 300 })
  // query is the debounced value, setQuery triggers debounce
  return <input onChange={(e) => setQuery(e.target.value)} />
}
```

### ✅ Correct — use value hook for derived props

```tsx
function FilteredList({ filter }: { filter: string }) {
  const [debouncedFilter] = useDebouncedValue(filter, { wait: 300 })
  return <ExpensiveList filter={debouncedFilter} />
}
```

## Decision Guide

- **"I need to wrap a function"** → `use[Utility]Callback`
- **"I need debounced/throttled React state"** → `use[Utility]State`
- **"I need to derive a value from props"** → `use[Utility]Value`
- **"I need full instance access (flush, cancel, Subscribe)"** → `use[Utility]`

## Async Variants

For API calls, use async hooks: `useAsyncDebouncedCallback`, `useAsyncThrottledCallback`, etc. These add error handling, retry, abort, and return values.
