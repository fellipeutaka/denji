// Motion Layout Animations & Shared Element Transitions
// Production-tested with Motion v12.23.24, React 19

/**
 * INSTALLATION
 *
 * pnpm add motion
 *
 * USAGE
 *
 * Copy components below into your project.
 * Layout animations use the FLIP technique for smooth, hardware-accelerated transitions.
 *
 * For Next.js App Router, add "use client" directive at top of file.
 */

import { LayoutGroup, motion } from "motion/react";
import { type ReactNode, useState } from "react";

// ============================================================================
// PATTERN 1: Basic Layout Animation
// ============================================================================

/**
 * Automatically animates layout changes (position, size, etc.)
 * Uses FLIP technique: First, Last, Invert, Play
 */
export function ExpandableCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className={`cursor-pointer rounded-lg border bg-white p-6 shadow-md ${
        isExpanded ? "w-full" : "w-64"
      }`} // Enable FLIP layout animations
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      transition={{ layout: { duration: 0.3, type: "spring" } }}
    >
      <motion.h3 className="mb-2 font-bold text-xl" layout>
        Click to Expand
      </motion.h3>

      {isExpanded && (
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p>This content appears when expanded.</p>
          <p className="mt-2">Layout automatically animates the size change.</p>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * KEY CONCEPT: The `layout` prop tells Motion to automatically animate
 * any layout changes (width, height, position) using GPU-accelerated transforms.
 * No JavaScript calculation needed - it's all done via FLIP technique.
 */

// ============================================================================
// PATTERN 2: Shared Element Transition (layoutId)
// ============================================================================

/**
 * Animate the same element between different states or routes.
 * Perfect for card → detail page transitions.
 */
interface Card {
  id: string;
  title: string;
  description: string;
  color: string;
}

export function SharedElementExample() {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const cards: Card[] = [
    {
      id: "1",
      title: "Card 1",
      description: "Full description for card 1",
      color: "bg-red-500",
    },
    {
      id: "2",
      title: "Card 2",
      description: "Full description for card 2",
      color: "bg-blue-500",
    },
    {
      id: "3",
      title: "Card 3",
      description: "Full description for card 3",
      color: "bg-green-500",
    },
  ];

  return (
    <div>
      {/* Grid view */}
      {!selectedCard && (
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <motion.div
              className={`${card.color} flex h-32 cursor-pointer items-center justify-center rounded-lg p-6 text-white`}
              key={card.id} // Connect this element to detail view
              layoutId={card.id}
              onClick={() => setSelectedCard(card)}
            >
              <motion.h3
                className="font-bold text-xl"
                layoutId={`title-${card.id}`}
              >
                {card.title}
              </motion.h3>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail view */}
      {selectedCard && (
        <motion.div
          className={`${selectedCard.color} cursor-pointer rounded-lg p-12 text-white`} // Same layoutId = smooth transition
          layoutId={selectedCard.id}
          onClick={() => setSelectedCard(null)}
        >
          <motion.h3
            className="mb-4 font-bold text-4xl"
            layoutId={`title-${selectedCard.id}`}
          >
            {selectedCard.title}
          </motion.h3>
          <motion.p
            animate={{ opacity: 1 }}
            className="text-xl"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            {selectedCard.description}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * KEY CONCEPT: Elements with the same `layoutId` are treated as the same element
 * across different states/routes. Motion automatically morphs between them.
 */

// ============================================================================
// PATTERN 3: List Reordering with Layout
// ============================================================================

/**
 * Automatically animate items when list order changes.
 * Perfect for drag-to-reorder, filtering, sorting.
 */
interface Item {
  id: number;
  text: string;
}

export function AnimatedList() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, text: "Item 1" },
    { id: 2, text: "Item 2" },
    { id: 3, text: "Item 3" },
    { id: 4, text: "Item 4" },
  ]);

  const shuffle = () => {
    setItems([...items].sort(() => Math.random() - 0.5));
  };

  const reverse = () => {
    setItems([...items].reverse());
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={shuffle}
        >
          Shuffle
        </button>
        <button
          className="rounded bg-purple-600 px-4 py-2 text-white"
          onClick={reverse}
        >
          Reverse
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <motion.div
            className="rounded-lg border bg-white p-4 shadow-sm"
            key={item.id} // Animate position changes automatically
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {item.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * KEY CONCEPT: When items reorder, the `layout` prop automatically animates
 * each item to its new position. No manual position calculation needed.
 */

// ============================================================================
// PATTERN 4: LayoutGroup (Namespacing)
// ============================================================================

/**
 * Use LayoutGroup to namespace layoutIds for reusable components.
 * Prevents conflicts when using multiple instances.
 */
interface TabPanelProps {
  tabs: Array<{ id: string; label: string; content: ReactNode }>;
}

export function TabPanel({ tabs }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <LayoutGroup>
      {" "}
      {/* Namespace layoutIds within this group */}
      <div className="space-y-4">
        {/* Tab buttons */}
        <div className="flex gap-4 border-gray-200 border-b">
          {tabs.map((tab) => (
            <button
              className="relative px-4 py-2"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}

              {/* Shared underline */}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600" // Shared within LayoutGroup
                  layoutId="underline"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>
    </LayoutGroup>
  );
}

/**
 * USAGE
 *
 * <div className="grid grid-cols-2 gap-4">
 *   <TabPanel tabs={[...]} />
 *   <TabPanel tabs={[...]} />  {/* No layoutId conflicts! */ }
 * </div>
 */

// ============================================================================
// PATTERN 5: Scrollable Container (layoutScroll)
// ============================================================================

/**
 * Fix layout animations in scrollable containers.
 * Without layoutScroll, animations break when container is scrolled.
 */
export function ScrollableList() {
  const [items, setItems] = useState<Item[]>(
    Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      text: `Item ${i + 1}`,
    }))
  );

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <motion.div
      className="h-96 space-y-2 overflow-auto rounded-lg border border-gray-200 p-4" // CRITICAL: Fixes animations in scrolled containers
      layoutScroll
    >
      {items.map((item) => (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm"
          exit={{ opacity: 0, scale: 0.8 }}
          initial={{ opacity: 0, scale: 0.8 }}
          key={item.id}
          layout
        >
          <span>{item.text}</span>
          <button
            className="rounded bg-red-500 px-3 py-1 text-sm text-white"
            onClick={() => removeItem(item.id)}
          >
            Remove
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * KEY CONCEPT: Without `layoutScroll`, removing items from a scrolled container
 * causes incomplete/broken animations. layoutScroll fixes this by accounting
 * for scroll offset in FLIP calculations.
 */

// ============================================================================
// PATTERN 6: Fixed Position (layoutRoot)
// ============================================================================

/**
 * Fix layout animations in fixed-position elements.
 * Without layoutRoot, fixed elements animate incorrectly.
 */
export function FixedModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="rounded bg-blue-600 px-4 py-2 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        Toggle Fixed Modal
      </button>

      {isOpen && (
        <motion.div
          className="fixed right-4 bottom-4 z-50 w-64 rounded-lg border bg-white p-4 shadow-2xl" // CRITICAL: Fixes animations in fixed elements
          layout
          layoutRoot
        >
          <h3 className="mb-2 font-bold">Fixed Modal</h3>
          <p className="text-gray-700 text-sm">
            This is a fixed-position element with layout animations.
          </p>
        </motion.div>
      )}
    </>
  );
}

/**
 * KEY CONCEPT: Fixed-position elements need `layoutRoot` to correctly
 * calculate scroll offset during FLIP animations.
 */

// ============================================================================
// PATTERN 7: Grid → List View Switching
// ============================================================================

/**
 * Smooth transition between grid and list layouts.
 */
export function ViewSwitcher() {
  const [view, setView] = useState<"grid" | "list">("grid");

  const items = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
  }));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          className={`rounded px-4 py-2 ${
            view === "grid" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setView("grid")}
        >
          Grid
        </button>
        <button
          className={`rounded px-4 py-2 ${
            view === "list" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setView("list")}
        >
          List
        </button>
      </div>

      <motion.div
        className={view === "grid" ? "grid grid-cols-3 gap-4" : "space-y-2"}
        layout
      >
        {items.map((item) => (
          <motion.div
            className="rounded-lg border bg-white p-6 shadow-sm"
            key={item.id}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h3 className="font-bold">{item.title}</h3>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================================================
// PATTERN 8: Drag to Reorder (Manual Implementation)
// ============================================================================

/**
 * Drag items to reorder with visual feedback.
 * Note: Motion's Reorder component has Next.js compatibility issues.
 * This is a manual implementation that works everywhere.
 */
export function DragToReorder() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, text: "Drag me" },
    { id: 2, text: "Reorder me" },
    { id: 3, text: "Move me around" },
    { id: 4, text: "Drop me anywhere" },
  ]);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <motion.div
          className="cursor-grab rounded-lg border bg-white p-4 shadow-sm active:cursor-grabbing"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          key={item.id}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          whileDrag={{ scale: 1.05, boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-gray-400">☰</span>
            <span>{item.text}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Note: Full drag-to-reorder with position updates requires tracking
 * drag position and updating array order. For production, consider:
 * - @dnd-kit/core (recommended for Next.js)
 * - react-beautiful-dnd
 * - Motion's Reorder component (has Next.js issues, see GitHub #2183)
 */

// ============================================================================
// PATTERN 9: Masonry Layout Animation
// ============================================================================

/**
 * Animate items in masonry/Pinterest-style layout.
 */
export function MasonryLayout() {
  const [items, setItems] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      height: Math.floor(Math.random() * 200) + 100,
    }))
  );

  const shuffle = () => {
    setItems([...items].sort(() => Math.random() - 0.5));
  };

  return (
    <div>
      <button
        className="mb-4 rounded bg-blue-600 px-4 py-2 text-white"
        onClick={shuffle}
      >
        Shuffle
      </button>

      <div className="columns-3 gap-4">
        {items.map((item) => (
          <motion.div
            className="mb-4 break-inside-avoid rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-4 font-bold text-white"
            key={item.id}
            layout
            style={{ height: item.height }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            Item {item.id}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ALL EXAMPLES DEMO
// ============================================================================

export function LayoutAnimationsDemo() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8">
      <h1 className="mb-8 font-bold text-4xl">
        Layout Animations & Shared Elements
      </h1>

      <section>
        <h2 className="mb-4 font-bold text-2xl">1. Basic Layout Animation</h2>
        <ExpandableCard />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">
          2. Shared Element Transition
        </h2>
        <SharedElementExample />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">3. List Reordering</h2>
        <AnimatedList />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">
          4. Tab Panel with LayoutGroup
        </h2>
        <TabPanel
          tabs={[
            { id: "1", label: "Tab 1", content: <p>Content for tab 1</p> },
            { id: "2", label: "Tab 2", content: <p>Content for tab 2</p> },
            { id: "3", label: "Tab 3", content: <p>Content for tab 3</p> },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">5. Scrollable Container</h2>
        <ScrollableList />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">6. Fixed Position Modal</h2>
        <FixedModal />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">7. Grid/List View Switcher</h2>
        <ViewSwitcher />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">8. Drag to Reorder</h2>
        <DragToReorder />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">9. Masonry Layout</h2>
        <MasonryLayout />
      </section>
    </div>
  );
}

/**
 * PERFORMANCE TIPS
 *
 * 1. Add willChange for layout animations:
 *    <motion.div layout style={{ willChange: "transform" }} />
 *
 * 2. Use layout prop only when needed:
 *    - If element size/position doesn't change, don't use layout
 *
 * 3. Combine with AnimatePresence for enter/exit:
 *    <AnimatePresence>
 *      {items.map(item => (
 *        <motion.div key={item.id} layout exit={{ opacity: 0 }} />
 *      ))}
 *    </AnimatePresence>
 *
 * 4. Use LayoutGroup to isolate layout calculations:
 *    - Prevents unnecessary recalculations across unrelated components
 *
 * See ../references/performance-optimization.md for full guide
 */

/**
 * COMMON ISSUES
 *
 * 1. Broken animations in scrollable containers
 *    Solution: Add layoutScroll prop
 *
 * 2. Incorrect animations in fixed elements
 *    Solution: Add layoutRoot prop
 *
 * 3. layoutId conflicts in reusable components
 *    Solution: Wrap in LayoutGroup
 *
 * 4. Elements not unmounting with layoutId + AnimatePresence
 *    Solution: Use LayoutGroup or avoid mixing exit + layout animations
 *
 * See ../SKILL.md for full troubleshooting guide
 */

/**
 * NEXT.JS USAGE
 *
 * Add "use client" directive at top of file:
 *
 * "use client"
 *
 * import { motion, LayoutGroup } from "motion/react-client"
 *
 * See ../references/nextjs-integration.md for comprehensive guide
 */
