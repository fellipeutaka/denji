# State & Reactivity

TanStack Pacer uses TanStack Store internally. State subscriptions are opt-in to prevent unnecessary re-renders.

## State Access

### ❌ Incorrect — no selector causes empty state

```tsx
const debouncer = useDebouncer(fn, { wait: 300 })
console.log(debouncer.state) // {} — always empty without selector
```

### ✅ Correct — opt-in with selector

```tsx
const debouncer = useDebouncer(
  fn,
  { wait: 300 },
  (state) => ({
    isPending: state.isPending,
    executionCount: state.executionCount,
  }),
)
console.log(debouncer.state) // { isPending: true, executionCount: 5 }
```

## Subscribe Component

Use `.Subscribe` for deep tree subscriptions without prop drilling:

```tsx
const debouncer = useDebouncer(fn, { wait: 300 })

// No re-renders on parent — only Subscribe children re-render
<debouncer.Subscribe
  selector={(state) => ({ isPending: state.isPending })}
>
  {(state) => <span>{state.isPending ? 'Pending...' : 'Ready'}</span>}
</debouncer.Subscribe>
```

## Available State Properties

### Sync Utilities

- `isPending` — has a pending execution
- `executionCount` — total executions
- `lastArgs` — most recent arguments
- `status` — current status string

### Async Utilities (additional)

- `isExecuting` — currently running async operation
- `lastResult` — most recent return value
- `successCount`, `errorCount`, `settleCount`

### Rate Limiter (additional)

- `isExceeded` — rate limit exceeded
- `rejectionCount` — rejected calls
- `getRemainingInWindow()` — remaining calls in window
- `getMsUntilNextWindow()` — ms until window resets

### Queuer (additional)

- `size`, `isEmpty`, `isFull`, `isRunning`, `isIdle`
- `items` — current queue contents

## Manual Store Access

For non-React code or vanilla JS:

```tsx
debouncer.store.subscribe((state) => {
  console.log('State changed:', state)
})
```
