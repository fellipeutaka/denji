# TanStack Virtual Patterns

## Horizontal

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
  horizontal: true,
})

<div ref={parentRef} style={{ width: '400px', overflowX: 'auto' }}>
  <div style={{ width: `${virtualizer.getTotalSize()}px`, height: '100%', position: 'relative' }}>
    {virtualizer.getVirtualItems().map((item) => (
      <div
        key={item.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${item.size}px`,
          transform: `translateX(${item.start}px)`,
        }}
      >
        {items[item.index]}
      </div>
    ))}
  </div>
</div>
```

## Variable Size (known sizes)

Pass sizes from data — no measurement needed:

```tsx
const sizes = [35, 80, 120, 45, 200] // known heights per index

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: (index) => sizes[index],
})
```

## Masonry / Lanes

`item.lane` gives the column index (0-based):

```tsx
const LANES = 3

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 150,
  lanes: LANES,
})

{virtualizer.getVirtualItems().map((item) => (
  <div
    key={item.key}
    data-index={item.index}
    ref={virtualizer.measureElement}
    style={{
      position: 'absolute',
      top: 0,
      left: `${(item.lane / LANES) * 100}%`,
      width: `${100 / LANES}%`,
      transform: `translateY(${item.start}px)`,
    }}
  >
    {items[item.index]}
  </div>
))}
```

## Sticky Items

Use `rangeExtractor` to always include certain indexes (e.g. group headers):

```tsx
import { defaultRangeExtractor } from '@tanstack/react-virtual'

const stickyIndexes = [0, 10, 20] // group header indexes

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
  rangeExtractor: (range) => {
    const next = new Set([
      ...stickyIndexes.filter((i) => i <= range.endIndex),
      ...defaultRangeExtractor(range),
    ])
    return Array.from(next).sort((a, b) => a - b)
  },
})

// In render — sticky items use position sticky, not absolute:
const isSticky = stickyIndexes.includes(item.index)
style={{
  position: isSticky ? 'sticky' : 'absolute',
  top: isSticky ? `${item.start}px` : 0,
  zIndex: isSticky ? 1 : 0,
  // ...rest of styles
}}
```

## Infinite Scroll

Trigger fetch when the last rendered item approaches end of known data:

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(...)
const allItems = data?.pages.flatMap((p) => p.items) ?? []

const virtualizer = useVirtualizer({
  count: hasNextPage ? allItems.length + 1 : allItems.length, // +1 = loader sentinel
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
})

useEffect(() => {
  const lastItem = virtualizer.getVirtualItems().at(-1)
  if (!lastItem) return
  if (lastItem.index >= allItems.length - 1 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
}, [virtualizer.getVirtualItems()])

// Render loader for the sentinel row:
{item.index > allItems.length - 1
  ? <div>Loading more...</div>
  : <div>{allItems[item.index]}</div>
}
```

## Gap & Padding

Use `gap` instead of CSS margin (margin breaks absolute positioning):

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
  gap: 8,          // 8px between each item
  paddingStart: 16, // space before first item
  paddingEnd: 16,   // space after last item
})
```

## React 19 Compatibility

React 19 warns when `flushSync` is called during render. Suppress it:

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
  useFlushSync: false, // slight scroll smoothness tradeoff
})
```

## SSR / Conditional Rendering

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
  initialRect: { width: 0, height: 600 }, // prevents layout thrash on hydration
  initialOffset: savedScrollOffset,        // restore scroll position
})
```
