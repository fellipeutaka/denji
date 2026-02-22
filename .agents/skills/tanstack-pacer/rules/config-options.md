# Configuration & Options

TanStack Pacer supports dynamic options, shared configuration, PacerProvider defaults, and runtime updates.

## Dynamic Options

Most options accept functions for runtime adaptation:

```tsx
const debouncer = useDebouncedCallback(fn, {
  // Increase wait based on execution count (adaptive backoff)
  wait: (debouncer) => Math.min(debouncer.store.state.executionCount * 100, 2000),
  // Disable after 10 executions
  enabled: (debouncer) => debouncer.store.state.executionCount < 10,
})
```

## Option Helpers (Type-Safe Sharing)

```tsx
import { debouncerOptions, throttlerOptions } from '@tanstack/pacer'

const sharedDebounceOpts = debouncerOptions({ wait: 300, leading: false })

// Reuse across components
const search = useDebouncedCallback(searchFn, sharedDebounceOpts)
const filter = useDebouncedCallback(filterFn, sharedDebounceOpts)
```

## PacerProvider

Set defaults for all utilities in the component tree:

```tsx
import { PacerProvider } from '@tanstack/react-pacer'

<PacerProvider
  defaultOptions={{
    debouncer: { wait: 300 },
    throttler: { wait: 200 },
    rateLimiter: { limit: 10, window: 60000 },
    queuer: { concurrency: 3 },
    batcher: { maxSize: 50, wait: 5000 },
  }}
>
  <App />
</PacerProvider>
```

Per-hook options override provider defaults.

## Runtime Updates

```tsx
const debouncer = useDebouncer(fn, { wait: 300 })

// Update options dynamically
debouncer.setOptions({ wait: 500, enabled: false })
```

## Initial State (Persistence)

Restore state from a previous session:

```tsx
const debouncer = useDebouncer(fn, {
  wait: 300,
  initialState: {
    executionCount: savedCount,
  },
})
```

## Callbacks (Sync)

- `onExecute`: called after each successful execution

## Callbacks (Async)

- `onSuccess(result, args, instance)`: after successful execution
- `onError(error, args, instance)`: on error
- `onSettled(args, instance)`: after success or error
- `onReject(args, instance)`: rate limiter only — call rejected
