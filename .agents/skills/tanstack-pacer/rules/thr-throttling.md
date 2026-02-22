# Throttling

Throttling ensures evenly-spaced execution at a fixed interval. Use for scroll handlers, progress updates, and real-time position tracking.

## Core API

- **Class**: `Throttler` / `AsyncThrottler`
- **Function**: `throttle()` / `asyncThrottle()`
- **React**: `useThrottledCallback` / `useAsyncThrottledCallback`

## Key Options

- `wait`: minimum ms between executions (or function)
- `leading`: execute immediately on first call (default: `true`)
- `trailing`: execute last call after wait (default: `true`)
- `enabled`: enable/disable dynamically

## Examples

### ❌ Incorrect — using debouncing for scroll position

```tsx
// Debounce waits for scrolling to STOP — misses intermediate positions
const onScroll = useDebouncedCallback(
  () => trackPosition(window.scrollY),
  { wait: 100 },
)
```

### ✅ Correct — throttle for evenly-spaced updates

```tsx
const onScroll = useThrottledCallback(
  () => trackPosition(window.scrollY),
  { wait: 100 },
)
```

### ❌ Incorrect — using rate limiting for smooth spacing

```tsx
// Rate limiting is bursty — allows N calls instantly, then blocks
const save = useRateLimitedCallback(saveDraft, { limit: 1, window: 5000 })
```

### ✅ Correct — throttle for smooth, predictable spacing

```tsx
const save = useThrottledCallback(saveDraft, { wait: 5000 })
```

## Throttle vs Debounce

| | Debounce | Throttle |
|--|----------|----------|
| **Timing** | After activity stops | At regular intervals |
| **Guarantees** | Last call only | Periodic execution |
| **Use case** | Search input | Scroll tracking |
| **leading default** | `false` | `true` |

## When to Use Throttling

- Scroll/resize/mousemove handlers
- Progress bar updates
- Real-time position tracking
- Auto-save at regular intervals
- Any case where you need guaranteed periodic execution
