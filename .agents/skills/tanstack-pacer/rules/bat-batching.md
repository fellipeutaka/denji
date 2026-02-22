# Batching

Batching groups multiple items and processes them together in a single operation. Use for bulk API calls, database writes, and analytics events.

## Core API

- **Sync**: `Batcher` class, `batch()` function
- **Async**: `AsyncBatcher` class, `asyncBatch()` function
- **React**: `useBatcher` / `useAsyncBatcher`

## Key Options

- `maxSize`: max items per batch (default: `Infinity`)
- `wait`: max wait time before processing (default: `Infinity`)
- `getShouldExecute`: custom trigger logic
- `started`: auto-start (default: `true`)

## Batch Triggers

A batch is processed when ANY condition is met:

1. `maxSize` items accumulated
2. `wait` ms elapsed since first item
3. `getShouldExecute` returns `true`
4. `execute()` or `flush()` called manually

## Examples

### Bulk API Writes

```tsx
const batcher = useAsyncBatcher(
  async (items: LogEvent[]) => {
    await fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(items),
    })
  },
  { maxSize: 50, wait: 5000 }, // batch every 50 items or 5 seconds
)

// Add items — they accumulate until batch triggers
batcher.addItem({ event: 'click', target: 'button' })
```

### Custom Trigger

```tsx
const batcher = useBatcher(processBatch, {
  getShouldExecute: (items, batcher) => {
    // Process when total payload exceeds 1MB
    const size = items.reduce((sum, item) => sum + item.size, 0)
    return size > 1_000_000
  },
})
```

### ❌ Incorrect — using batching for individual processing

```tsx
// Batching groups items — if you need one-by-one processing, use queuing
const processor = useAsyncBatcher(
  async (items) => {
    for (const item of items) await processItem(item)
  },
  { maxSize: 1 }, // Defeats the purpose
)
```

### ✅ Correct — use queuing for sequential processing

```tsx
const processor = useAsyncQueuer(processItem, { concurrency: 1 })
```

## Async Error Tracking

```tsx
const batcher = useAsyncBatcher(bulkInsert, {
  maxSize: 100,
  onError: (error, items, instance) => {
    console.error(`Batch failed: ${instance.state.totalItemsFailed} items`)
    const failed = instance.peekFailedItems()
    // Retry failed items
  },
})
```

## Methods

- `addItem(item)` — add item to current batch
- `execute()` — process current batch
- `flush()` — process immediately
- `reset()` — clear batch and reset state
