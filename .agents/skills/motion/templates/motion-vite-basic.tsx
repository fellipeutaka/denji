// Motion + Vite + React + TypeScript - Basic Setup
// Production-tested with Motion v12.23.24, React 19, Vite 6

/**
 * INSTALLATION
 *
 * 1. Install Motion:
 *    pnpm add motion
 *
 * 2. Install React + TypeScript (if new project):
 *    pnpm create vite my-app --template react-ts
 *    cd my-app
 *    pnpm install
 *
 * 3. Copy this file to src/components/AnimatedExamples.tsx
 *
 * 4. Import in your App.tsx:
 *    import { AnimatedExamples } from '@/components/AnimatedExamples'
 *
 * NO VITE CONFIGURATION NEEDED - works out of the box
 */

import { motion } from "motion/react";
import { useState } from "react";

/**
 * Example 1: Basic Animation
 * Fade in and slide up on mount
 */
export function FadeInBox() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-blue-100 p-6"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="font-bold text-xl">I fade in and slide up!</h2>
      <p className="text-gray-700">Basic animation example</p>
    </motion.div>
  );
}

/**
 * Example 2: Hover and Tap Gestures
 * Scale on hover, shrink on tap
 */
export function InteractiveButton() {
  return (
    <motion.button
      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      Hover and Click Me
    </motion.button>
  );
}

/**
 * Example 3: Variants (Named Animation States)
 * Propagates through component tree automatically
 */
interface Item {
  id: number;
  text: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each child (in seconds)
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export function StaggeredList() {
  const [items] = useState<Item[]>([
    { id: 1, text: "First item" },
    { id: 2, text: "Second item" },
    { id: 3, text: "Third item" },
    { id: 4, text: "Fourth item" },
  ]);

  return (
    <motion.ul
      animate="show"
      className="space-y-2"
      initial="hidden"
      variants={containerVariants}
    >
      {items.map((item) => (
        <motion.li
          className="rounded-lg border bg-white p-4 shadow-sm"
          key={item.id}
          variants={itemVariants}
        >
          {item.text}
        </motion.li>
      ))}
    </motion.ul>
  );
}

/**
 * Example 4: Spring Physics
 * Natural, physics-based motion
 */
export function SpringButton() {
  const [isActive, setIsActive] = useState(false);

  return (
    <motion.button
      animate={{
        scale: isActive ? 1.2 : 1,
        rotate: isActive ? 180 : 0,
      }}
      className="h-16 w-16 rounded-full bg-purple-600 text-white"
      onClick={() => setIsActive(!isActive)}
      transition={{
        type: "spring",
        stiffness: 300, // Higher = more sudden movement
        damping: 10, // Higher = less oscillation
        mass: 1, // Higher = more lethargic
      }}
    >
      🎨
    </motion.button>
  );
}

/**
 * Example 5: Keyframes
 * Multiple intermediate states
 */
export function KeyframeAnimation() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1.2, 1, 1],
        rotate: [0, 0, 180, 180, 0],
        borderRadius: ["10%", "10%", "50%", "50%", "10%"],
      }}
      className="h-20 w-20 bg-gradient-to-br from-pink-500 to-purple-600"
      transition={{
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.2, 0.5, 0.8, 1], // When each keyframe happens (0-1)
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: 1,
      }}
    />
  );
}

/**
 * Example 6: Drag Gesture
 * Drag with constraints and elastic edges
 */
export function DraggableBox() {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100">
      <motion.div
        className="absolute flex h-16 w-16 cursor-grab items-center justify-center rounded-lg bg-red-500 font-bold text-white active:cursor-grabbing"
        drag
        dragConstraints={{ left: 0, right: 300, top: 0, bottom: 200 }} // Elasticity at constraints (0-1)
        dragElastic={0.2} // Disable momentum/inertia
        dragMomentum={false}
      >
        DRAG
      </motion.div>
    </div>
  );
}

/**
 * Example 7: Hover Color Change
 * Animate any CSS property
 */
export function ColorChangeCard() {
  return (
    <motion.div
      className="cursor-pointer rounded-lg bg-gray-200 p-6 text-gray-900"
      transition={{ duration: 0.3 }}
      whileHover={{
        backgroundColor: "#3b82f6", // Tailwind blue-600
        color: "#ffffff",
      }}
    >
      <h3 className="font-bold text-lg">Hover me!</h3>
      <p>Background and text color change on hover</p>
    </motion.div>
  );
}

/**
 * Example 8: TypeScript Types
 * Motion components are fully typed
 */
interface AnimatedCardProps {
  title: string;
  description: string;
  delay?: number;
}

export function AnimatedCard({
  title,
  description,
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay, duration: 0.5 }}
    >
      <h3 className="mb-2 font-bold text-xl">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </motion.div>
  );
}

/**
 * Example 9: Tailwind Integration
 * ⚠️ IMPORTANT: Remove Tailwind transition classes to avoid conflicts
 */
export function TailwindIntegration() {
  return (
    <div className="space-y-4">
      {/* ❌ Wrong - Tailwind transition conflicts with Motion */}
      {/* <motion.div className="transition-all duration-300" animate={{ x: 100 }} /> */}

      {/* ✅ Correct - Let Motion handle animations, Tailwind for styles */}
      <motion.div
        className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white"
        whileHover={{ scale: 1.05 }}
      >
        Tailwind styles + Motion animations (no transition classes)
      </motion.div>
    </div>
  );
}

/**
 * All Examples Component
 * Demo of all patterns above
 */
export function AnimatedExamples() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <h1 className="mb-8 font-bold text-3xl">Motion Animation Examples</h1>

      <section>
        <h2 className="mb-4 font-bold text-2xl">1. Basic Animation</h2>
        <FadeInBox />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">2. Hover & Tap Gestures</h2>
        <InteractiveButton />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">
          3. Staggered List (Variants)
        </h2>
        <StaggeredList />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">4. Spring Physics</h2>
        <SpringButton />
        <p className="mt-2 text-gray-600 text-sm">Click to toggle</p>
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">5. Keyframe Animation</h2>
        <KeyframeAnimation />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">6. Drag Gesture</h2>
        <DraggableBox />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">7. Color Change</h2>
        <ColorChangeCard />
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">8. TypeScript Example</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AnimatedCard
            delay={0}
            description="First card with no delay"
            title="Card 1"
          />
          <AnimatedCard
            delay={0.2}
            description="Second card with 0.2s delay"
            title="Card 2"
          />
          <AnimatedCard
            delay={0.4}
            description="Third card with 0.4s delay"
            title="Card 3"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bold text-2xl">9. Tailwind Integration</h2>
        <TailwindIntegration />
      </section>
    </div>
  );
}

/**
 * USAGE IN APP.TSX
 *
 * import { AnimatedExamples } from '@/components/AnimatedExamples'
 *
 * function App() {
 *   return <AnimatedExamples />
 * }
 */

/**
 * PERFORMANCE TIPS
 *
 * 1. Add willChange for transforms:
 *    <motion.div style={{ willChange: "transform" }} />
 *
 * 2. Use LazyMotion for smaller bundle (34 KB → 4.6 KB):
 *    import { LazyMotion, domAnimation, m } from "motion/react"
 *    <LazyMotion features={domAnimation}>
 *      <m.div animate={{ x: 100 }} />
 *    </LazyMotion>
 *
 * 3. For large lists (50+ items), use virtualization:
 *    pnpm add react-window
 *
 * See ../references/performance-optimization.md for full guide
 */

/**
 * ACCESSIBILITY
 *
 * Respect prefers-reduced-motion:
 *
 * import { MotionConfig } from "motion/react"
 *
 * <MotionConfig reducedMotion="user">
 *   <App />
 * </MotionConfig>
 *
 * User settings:
 * - macOS: System Settings → Accessibility → Display → Reduce motion
 * - Windows: Settings → Ease of Access → Display → Show animations
 * - iOS: Settings → Accessibility → Motion
 * - Android 9+: Settings → Accessibility → Remove animations
 */
