// Motion UI Components - Modal, Accordion, Carousel, Tabs
// Production-tested with Motion v12.23.24, React 19

/**
 * INSTALLATION
 *
 * pnpm add motion
 *
 * USAGE
 *
 * Copy components below into your project.
 * All components are production-ready and fully typed.
 *
 * For Next.js App Router, add "use client" directive at top of file.
 */

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useRef, useState } from "react";

// ============================================================================
// COMPONENT 1: Modal Dialog
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 cursor-pointer bg-black/50"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="backdrop"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.dialog
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed inset-0 z-50 m-auto h-fit w-full max-w-md rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-800"
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            key="dialog"
            style={{ willChange: "transform, opacity" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-2xl">{title}</h2>
              <motion.button
                className="text-2xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>

            {/* Content */}
            <div className="text-gray-700 dark:text-gray-300">{children}</div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <motion.button
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Close
              </motion.button>
            </div>
          </motion.dialog>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * USAGE
 *
 * function App() {
 *   const [isOpen, setIsOpen] = useState(false)
 *
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Open Modal</button>
 *       <Modal
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         title="Welcome"
 *       >
 *         <p>Modal content goes here.</p>
 *       </Modal>
 *     </>
 *   )
 * }
 */

// ============================================================================
// COMPONENT 2: Accordion
// ============================================================================

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export function AccordionItem({
  title,
  children,
  isOpen,
  onToggle,
}: AccordionItemProps) {
  return (
    <div className="border-gray-200 border-b dark:border-gray-700">
      {/* Trigger */}
      <motion.button
        className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={onToggle}
        whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
      >
        <span className="font-semibold">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Content */}
      <motion.div
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        initial={false}
        style={{ overflow: "hidden" }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 text-gray-700 dark:text-gray-300">{children}</div>
      </motion.div>
    </div>
  );
}

interface AccordionProps {
  items: Array<{
    id: string;
    title: string;
    content: ReactNode;
  }>;
  allowMultiple?: boolean;
}

export function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {items.map((item) => (
        <AccordionItem
          isOpen={openItems.has(item.id)}
          key={item.id}
          onToggle={() => handleToggle(item.id)}
          title={item.title}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

/**
 * USAGE
 *
 * <Accordion
 *   allowMultiple={false}
 *   items={[
 *     { id: "1", title: "Section 1", content: <p>Content 1</p> },
 *     { id: "2", title: "Section 2", content: <p>Content 2</p> },
 *   ]}
 * />
 */

// ============================================================================
// COMPONENT 3: Carousel / Image Slider
// ============================================================================

interface CarouselProps {
  images: Array<{
    id: string;
    url: string;
    alt: string;
  }>;
}

export function Carousel({ images }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
      {/* Image */}
      <AnimatePresence custom={direction} initial={false}>
        <motion.img
          alt={images[currentIndex].alt}
          animate="center"
          className="absolute inset-0 h-full w-full object-cover"
          custom={direction}
          exit="exit"
          initial="enter"
          key={currentIndex}
          src={images[currentIndex].url}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          variants={variants}
        />
      </AnimatePresence>

      {/* Navigation buttons */}
      <button
        className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 shadow-lg dark:bg-gray-800/80"
        onClick={handlePrev}
      >
        ←
      </button>
      <button
        className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 shadow-lg dark:bg-gray-800/80"
        onClick={handleNext}
      >
        →
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {images.map((_, index) => (
          <motion.button
            animate={{
              scale: index === currentIndex ? 1.2 : 1,
              opacity: index === currentIndex ? 1 : 0.5,
            }}
            className="h-3 w-3 rounded-full bg-white"
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * USAGE
 *
 * <Carousel
 *   images={[
 *     { id: "1", url: "/image1.jpg", alt: "Image 1" },
 *     { id: "2", url: "/image2.jpg", alt: "Image 2" },
 *   ]}
 * />
 */

// ============================================================================
// COMPONENT 4: Drag-to-Scroll Carousel (Alternative)
// ============================================================================

interface DragCarouselProps {
  items: ReactNode[];
}

export function DragCarousel({ items }: DragCarouselProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="overflow-hidden rounded-lg bg-gray-100 p-4 dark:bg-gray-800"
      ref={constraintsRef}
    >
      <motion.div
        className="flex cursor-grab gap-4 active:cursor-grabbing"
        drag="x"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
      >
        {items.map((item, index) => (
          <motion.div
            className="flex h-64 min-w-[300px] items-center justify-center rounded-lg bg-white shadow-md dark:bg-gray-700"
            key={index}
            whileHover={{ scale: 1.05 }}
          >
            {item}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * USAGE
 *
 * <DragCarousel
 *   items={[
 *     <div>Card 1</div>,
 *     <div>Card 2</div>,
 *     <div>Card 3</div>,
 *   ]}
 * />
 */

// ============================================================================
// COMPONENT 5: Tabs with Shared Underline (layoutId)
// ============================================================================

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

export function Tabs({ tabs }: TabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-4 border-gray-200 border-b dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            className="relative px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}

            {/* Shared underline */}
            {activeTab === tab.id && (
              <motion.div
                className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="p-4"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          key={activeTab}
          transition={{ duration: 0.2 }}
        >
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * USAGE
 *
 * <Tabs
 *   tabs={[
 *     { id: "1", label: "Home", content: <p>Home content</p> },
 *     { id: "2", label: "Profile", content: <p>Profile content</p> },
 *     { id: "3", label: "Settings", content: <p>Settings content</p> },
 *   ]}
 * />
 */

// ============================================================================
// COMPONENT 6: Dropdown Menu
// ============================================================================

interface DropdownProps {
  trigger: ReactNode;
  items: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export function Dropdown({ trigger, items }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close on click outside */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {items.map((item, index) => (
                <motion.button
                  className="w-full px-4 py-2 text-left first:rounded-t-lg last:rounded-b-lg"
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                >
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * USAGE
 *
 * <Dropdown
 *   trigger={<button>Open Menu</button>}
 *   items={[
 *     { label: "Profile", onClick: () => console.log("Profile") },
 *     { label: "Settings", onClick: () => console.log("Settings") },
 *     { label: "Logout", onClick: () => console.log("Logout") },
 *   ]}
 * />
 */

// ============================================================================
// COMPONENT 7: Toast Notification
// ============================================================================

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
}

export function Toast({
  message,
  type = "info",
  isVisible,
  onClose,
}: ToastProps) {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className={`fixed top-4 right-4 ${colors[type]} z-50 flex items-center gap-4 rounded-lg px-6 py-4 text-white shadow-lg`}
          exit={{ opacity: 0, x: 300 }}
          initial={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <span>{message}</span>
          <motion.button
            className="text-white/80 hover:text-white"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * USAGE
 *
 * function App() {
 *   const [showToast, setShowToast] = useState(false)
 *
 *   return (
 *     <>
 *       <button onClick={() => setShowToast(true)}>Show Toast</button>
 *       <Toast
 *         message="Action completed!"
 *         type="success"
 *         isVisible={showToast}
 *         onClose={() => setShowToast(false)}
 *       />
 *     </>
 *   )
 * }
 */

// ============================================================================
// ALL COMPONENTS DEMO
// ============================================================================

export function UIComponentsDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-12 p-8">
      <h1 className="mb-8 font-bold text-4xl">Motion UI Components</h1>

      {/* Modal */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">1. Modal Dialog</h2>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          Open Modal
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
        >
          <p>This is a modal with smooth animations.</p>
        </Modal>
      </section>

      {/* Accordion */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">2. Accordion</h2>
        <Accordion
          items={[
            {
              id: "1",
              title: "Section 1",
              content: <p>Content for section 1</p>,
            },
            {
              id: "2",
              title: "Section 2",
              content: <p>Content for section 2</p>,
            },
            {
              id: "3",
              title: "Section 3",
              content: <p>Content for section 3</p>,
            },
          ]}
        />
      </section>

      {/* Carousel */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">3. Carousel</h2>
        <Carousel
          images={[
            {
              id: "1",
              url: "https://via.placeholder.com/800x400/ff6b6b",
              alt: "Red",
            },
            {
              id: "2",
              url: "https://via.placeholder.com/800x400/4ecdc4",
              alt: "Teal",
            },
            {
              id: "3",
              url: "https://via.placeholder.com/800x400/ffe66d",
              alt: "Yellow",
            },
          ]}
        />
      </section>

      {/* Drag Carousel */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">4. Drag Carousel</h2>
        <DragCarousel
          items={[
            <div className="font-bold text-2xl">Card 1</div>,
            <div className="font-bold text-2xl">Card 2</div>,
            <div className="font-bold text-2xl">Card 3</div>,
            <div className="font-bold text-2xl">Card 4</div>,
          ]}
        />
      </section>

      {/* Tabs */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">5. Tabs</h2>
        <Tabs
          tabs={[
            { id: "home", label: "Home", content: <p>Home tab content</p> },
            {
              id: "profile",
              label: "Profile",
              content: <p>Profile tab content</p>,
            },
            {
              id: "settings",
              label: "Settings",
              content: <p>Settings tab content</p>,
            },
          ]}
        />
      </section>

      {/* Dropdown */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">6. Dropdown Menu</h2>
        <Dropdown
          items={[
            { label: "Profile", onClick: () => alert("Profile clicked") },
            { label: "Settings", onClick: () => alert("Settings clicked") },
            { label: "Logout", onClick: () => alert("Logout clicked") },
          ]}
          trigger={
            <button className="rounded bg-gray-600 px-4 py-2 text-white">
              Open Menu
            </button>
          }
        />
      </section>

      {/* Toast */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">7. Toast Notification</h2>
        <button
          className="rounded bg-green-600 px-4 py-2 text-white"
          onClick={() => setShowToast(true)}
        >
          Show Toast
        </button>
        <Toast
          isVisible={showToast}
          message="Success! Action completed."
          onClose={() => setShowToast(false)}
          type="success"
        />
      </section>
    </div>
  );
}

/**
 * PERFORMANCE TIPS
 *
 * 1. Add willChange for transforms:
 *    style={{ willChange: "transform, opacity" }}
 *
 * 2. Use AnimatePresence mode="wait" for sequential animations
 *
 * 3. For large lists in carousels, use virtualization:
 *    pnpm add react-window
 *
 * See ../references/performance-optimization.md for full guide
 */

/**
 * ACCESSIBILITY TIPS
 *
 * 1. Add keyboard support:
 *    - Escape to close modals
 *    - Arrow keys for carousels
 *    - Enter/Space for accordion triggers
 *
 * 2. Add ARIA attributes:
 *    - aria-expanded for accordions
 *    - aria-hidden for modals
 *    - role="dialog" for modals
 *
 * 3. Respect prefers-reduced-motion:
 *    <MotionConfig reducedMotion="user">
 *      <UIComponentsDemo />
 *    </MotionConfig>
 */
