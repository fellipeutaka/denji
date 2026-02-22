# Rate Limiting

Rate limiting enforces a maximum number of executions within a time window. Use for API quota enforcement and abuse prevention.

## Core API

- **Class**: `RateLimiter` / `AsyncRateLimiter`
- **Function**: `rateLimit()` / `asyncRateLimit()`
- **React**: `useRateLimitedCallback` / `useAsyncRateLimitedCallback`

## Key Options

- `limit`: max calls per window (or function)
- `window`: time window in ms (or function)
- `windowType`: `'fixed'` (default) or `'sliding'`
- `enabled`: enable/disable (controls execution, NOT rate limiting)

## Window Types

### Fixed Window

Strict reset after each period. Can be bursty — allows `limit` calls at end of one window and `limit` at start of next.

### Sliding Window

Rolling window based on execution timestamps. Smoother execution, prevents bursts.

```tsx
const api = useRateLimitedCallback(callApi, {
  limit: 10,
  window: 60000, // 10 calls per minute
  windowType: 'sliding',
})
```

## Examples

### ❌ Incorrect — using rate limiting for evenly-spaced calls

```tsx
// Rate limiting allows bursts up to limit, then blocks entirely
const save = useRateLimitedCallback(saveDraft, {
  limit: 1,
  window: 5000,
})
```

### ✅ Correct — use throttling for even spacing

```tsx
const save = useThrottledCallback(saveDraft, { wait: 5000 })
```

### ❌ Incorrect — expecting lossless execution

```tsx
// Rate limiting is LOSSY — excess calls are rejected, not queued
const submit = useRateLimitedCallback(submitForm, {
  limit: 5,
  window: 60000,
})
```

### ✅ Correct — use queuing if all calls must execute

```tsx
const submit = useAsyncQueuer(submitForm, { concurrency: 1 })
```

## Rejection Handling

```tsx
const api = useRateLimitedCallback(callApi, {
  limit: 5,
  window: 60000,
  onReject: (args, instance) => {
    const ms = instance.getMsUntilNextWindow()
    toast.error(`Rate limited. Try again in ${Math.ceil(ms / 1000)}s`)
  },
})
```

## Important Notes

- Rate limiting is the most naive approach — prefer throttling/debouncing for most UI use cases
- Client-side only — not a substitute for server-side rate limiting
- `enabled` controls whether the function executes at all, NOT the rate limiting logic
