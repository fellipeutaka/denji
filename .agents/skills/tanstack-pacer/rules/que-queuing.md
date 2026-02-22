# Queuing

Queuing processes items sequentially (or with concurrency). The only "lossless" pattern — every item gets processed unless explicitly rejected or expired.

## Core API

- **Sync**: `Queuer` class, `queue()` function
- **Async**: `AsyncQueuer` class, `asyncQueue()` function
- **React**: `useQueuer` / `useAsyncQueuer`

## Key Options

- `wait`: delay between processing items
- `maxSize`: reject items when full (makes it lossy)
- `started`: auto-start processing (default: `true`)
- `addItemsTo`: `'front'` | `'back'` (default: `'back'`)
- `getItemsFrom`: `'front'` | `'back'` (default: `'front'`)
- `getPriority`: `(item) => number` — priority queue support
- `expirationDuration`: auto-expire old items
- `concurrency`: (async only) parallel processing count

## Queue Types

| Type | Config |
|------|--------|
| **FIFO** (default) | `addItemsTo: 'back'`, `getItemsFrom: 'front'` |
| **LIFO/Stack** | `addItemsTo: 'back'`, `getItemsFrom: 'back'` |
| **Priority** | Use `getPriority` callback |

## Examples

### Async Task Pool

```tsx
const uploader = useAsyncQueuer(
  async (file: File) => {
    const signal = uploader.getAbortSignal()
    return uploadFile(file, { signal })
  },
  { concurrency: 3 },
)

// Add files to queue
uploader.addItem(file1)
uploader.addItem(file2)
```

### Priority Queue

```tsx
const taskQueue = useQueuer(processTask, {
  getPriority: (task) => task.priority, // higher = processed first
})

taskQueue.addItem({ name: 'low', priority: 1 })
taskQueue.addItem({ name: 'high', priority: 10 }) // processed first
```

### Queue with Max Size

```tsx
const queue = useQueuer(process, {
  maxSize: 100,
  onReject: (item) => console.warn('Queue full, item rejected'),
})
```

## Control Methods

- `start()` / `stop()` — start/stop processing
- `clear()` — remove all pending items
- `flush()` — process all items immediately
- `reset()` — reset to initial state
- `peekNextItem()` / `peekAllItems()` — inspect without removing
- (async) `peekActiveItems()` / `peekPendingItems()`

## When to Use

- File upload queues
- Background task processing
- Ordered operation execution
- Any scenario where losing items is unacceptable
