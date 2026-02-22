# Async Patterns

All 5 utilities have async variants with error handling, retry, abort, and return values. Use async hooks for API calls, database operations, and any async work.

## When to Use Async

- Need the return value from the debounced/throttled function
- Need error handling within the utility (not just side effects)
- Need retry with backoff
- Need abort/cancellation of in-flight requests

## Abort Signal

### ❌ Incorrect — no cancellation of stale requests

```tsx
const search = useAsyncDebouncedCallback(
  async (query: string) => {
    const res = await fetch(`/api/search?q=${query}`)
    return res.json()
  },
  { wait: 300 },
)
```

### ✅ Correct — pass AbortSignal to fetch

```tsx
const search = useAsyncDebouncedCallback(
  async (query: string) => {
    const signal = search.getAbortSignal()
    const res = await fetch(`/api/search?q=${query}`, { signal })
    return res.json()
  },
  { wait: 300, onSuccess: (data) => setResults(data) },
)
```

## Retry Configuration

```tsx
const api = useAsyncDebouncedCallback(fetchData, {
  wait: 300,
  asyncRetryerOptions: {
    maxAttempts: 3,
    backoff: 'exponential', // 'fixed' | 'linear' | 'exponential'
    baseWait: 1000,
    maxWait: 30000,
    jitter: true, // randomize wait to prevent thundering herd
  },
})
```

## Error Handling

```tsx
const api = useAsyncThrottledCallback(submitData, {
  wait: 1000,
  onSuccess: (result, args, instance) => {
    toast.success('Saved')
  },
  onError: (error, args, instance) => {
    toast.error(error.message)
  },
  onSettled: (args, instance) => {
    // Runs after success OR error
  },
  // throwOnError: default true if no onError, false if onError provided
})
```

## Async Callbacks Summary

| Callback | When | Params |
|----------|------|--------|
| `onSuccess` | After successful execution | `(result, args, instance)` |
| `onError` | On execution error | `(error, args, instance)` |
| `onSettled` | After any execution | `(args, instance)` |
| `onReject` | Rate limiter only — call rejected | `(args, instance)` |

## Abort vs Cancel

- `cancel()` — cancel pending (queued) execution, does NOT abort in-flight
- `abort()` — abort currently executing async operation
- For queues: `abort()` aborts active tasks, not pending queue items
