# TanStack Virtual API Reference

## Required Options

```ts
count: number                           // total items to virtualize
getScrollElement: () => TScrollElement  // returns scroll container (may return null)
estimateSize: (index: number) => number // estimated or exact px size per item
```

## Optional Options

```ts
enabled?: boolean           // false = disable observers, reset state
overscan?: number           // extra items outside visible area (default: 1)
horizontal?: boolean        // true = horizontal orientation
gap?: number                // px gap between items
paddingStart?: number       // px padding before first item
paddingEnd?: number         // px padding after last item
scrollPaddingStart?: number // px padding when scrolling to element (start)
scrollPaddingEnd?: number   // px padding when scrolling to element (end)
scrollMargin?: number       // offset of list from scroll origin (window virtualizer)
lanes?: number              // columns (vertical) or rows (horizontal) for masonry (default: 1)
getItemKey?: (index: number) => Key // stable item keys (default: index) — memoize with useCallback
initialOffset?: number | (() => number) // initial scroll position (SSR/conditional render)
initialRect?: Rect          // initial scroll element dimensions (SSR)
rangeExtractor?: (range: Range) => number[] // custom rendered index set (sticky headers etc.)
measureElement?: (el, entry, instance) => number // custom size measurement
scrollToFn?: (offset, options, instance) => void // custom scroll implementation
isRtl?: boolean             // RTL horizontal scroll
isScrollingResetDelay?: number // ms before isScrolling resets (default: 150)
useScrollendEvent?: boolean    // use native scrollend event (default: false)
useAnimationFrameWithResizeObserver?: boolean // defer ResizeObserver to rAF (default: false — leave off)
onChange?: (instance, sync: boolean) => void  // fires on state change
debug?: boolean             // enable debug logs
```

### React-specific option

```ts
useFlushSync?: boolean // use flushSync for sync updates (default: true)
                       // set false for React 19 compat or performance on low-end devices
```

## Instance Methods & Properties

```ts
// Core
getVirtualItems(): VirtualItem[]     // currently rendered items
getVirtualIndexes(): number[]        // indexes of currently rendered items
getTotalSize(): number               // total px size of all items

// Scroll
scrollToIndex(index: number, options?: {
  align?: 'start' | 'center' | 'end' | 'auto'
  behavior?: 'auto' | 'smooth'
}): void
scrollToOffset(offset: number, options?: {
  align?: 'start' | 'center' | 'end' | 'auto'
  behavior?: 'auto' | 'smooth'
}): void

// Measurement
measure(): void                                    // reset all cached measurements
measureElement(el: TItemElement | null): void      // ref callback — requires data-index on element
resizeItem(index: number, size: number): void      // manually override item size

// State (read-only)
scrollOffset: number                               // current scroll position (px)
scrollRect: Rect                                   // { width, height } of scroll element
scrollDirection: 'forward' | 'backward' | null
isScrolling: boolean
scrollElement: TScrollElement | null
options: Required<VirtualizerOptions>
shouldAdjustScrollPositionOnItemSizeChange?: (item, delta, instance) => boolean
```

## VirtualItem Interface

```ts
interface VirtualItem {
  key: string | number | bigint  // stable key — use as React key (default: index)
  index: number                  // item index in the full list
  start: number                  // px offset from scroll container start → use in transform
  end: number                    // px offset of item end (rarely needed)
  size: number                   // px size — estimated until measureElement fires
  lane: number                   // lane index for masonry (always 0 for regular lists)
}
```

- `start` → `translateY` (vertical) or `translateX` (horizontal)
- `size` → CSS `height` (vertical) or `width` (horizontal)
- Always use `key` as React key, not `index`
