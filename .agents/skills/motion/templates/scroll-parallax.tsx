// Motion Scroll Animations & Parallax Effects
// Production-tested with Motion v12.23.24, React 19

/**
 * INSTALLATION
 *
 * pnpm add motion
 *
 * USAGE
 *
 * Copy examples below into your components.
 * All patterns use hardware-accelerated ScrollTimeline API when available.
 *
 * For Next.js App Router, add "use client" directive at top of file.
 */

import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef } from "react";

// ============================================================================
// PATTERN 1: Scroll-Triggered Reveal (whileInView)
// ============================================================================

/**
 * Fade in and slide up when element enters viewport.
 * Perfect for revealing sections as user scrolls.
 */
export function FadeInSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      viewport={{
        once: true, // Animate only once (don't re-animate on scroll up)
        margin: "-100px", // Start animation 100px before entering viewport
        amount: 0.3, // Trigger when 30% of element is visible
      }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * USAGE
 *
 * <FadeInSection>
 *   <h2>This section fades in when you scroll to it</h2>
 * </FadeInSection>
 */

// ============================================================================
// PATTERN 2: Parallax Hero Section
// ============================================================================

/**
 * Multi-layer parallax effect with different scroll speeds.
 * Perfect for hero sections and landing pages.
 */
export function ParallaxHero() {
  const { scrollY } = useScroll();

  // Transform scroll position to different speeds for each layer
  const y1 = useTransform(scrollY, [0, 1000], [0, -300]); // Fast layer (background)
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]); // Medium layer (middle)
  const y3 = useTransform(scrollY, [0, 1000], [0, -50]); // Slow layer (foreground)
  const opacity = useTransform(scrollY, [0, 300], [1, 0]); // Fade out

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background layer (fastest) */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: y1 }}>
        <img
          alt="Background"
          className="h-full w-full object-cover"
          src="/images/background.jpg"
        />
      </motion.div>

      {/* Middle layer (medium speed) */}
      <motion.div className="absolute inset-0 -z-5" style={{ y: y2 }}>
        <img
          alt="Mountains"
          className="h-full w-full object-cover"
          src="/images/mountains.png"
        />
      </motion.div>

      {/* Foreground content (slowest) + fade out */}
      <motion.div
        className="relative z-10 flex h-full items-center justify-center"
        style={{ y: y3, opacity }}
      >
        <div className="text-center text-white">
          <h1 className="mb-4 font-bold text-6xl">Welcome</h1>
          <p className="text-2xl">Scroll down to see parallax effect</p>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// PATTERN 3: Scroll-Linked Progress Bar
// ============================================================================

/**
 * Progress bar that fills as user scrolls through page.
 * Perfect for blog posts and long-form content.
 */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 right-0 left-0 z-50 h-1 origin-left bg-blue-600"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

/**
 * USAGE
 *
 * // In your layout or page
 * <ScrollProgressBar />
 * <YourContent />
 */

// ============================================================================
// PATTERN 4: Section-Specific Scroll Progress
// ============================================================================

/**
 * Track scroll progress within a specific section (not entire page).
 * Perfect for multi-section landing pages.
 */
export function SectionScrollIndicator() {
  const ref = useRef<HTMLDivElement>(null);

  // Only track scroll within this section
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // Start when section enters, end when it leaves
  });

  // Convert 0-1 progress to 0-100 for display
  const percentage = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section className="min-h-screen bg-gray-100 p-8" ref={ref}>
      <motion.div
        className="mb-4 h-2 origin-left bg-purple-600"
        style={{ scaleX: scrollYProgress }}
      />
      <motion.p className="font-bold text-2xl">
        Section Progress: {percentage.get().toFixed(0)}%
      </motion.p>
      <p className="mt-4 text-gray-700">
        Scroll through this section to see the progress bar fill.
      </p>
    </section>
  );
}

// ============================================================================
// PATTERN 5: Smooth Parallax with Spring Physics
// ============================================================================

/**
 * Parallax with spring physics for natural, smooth motion.
 * Adds inertia/lag effect like Apple's website.
 */
export function SmoothParallax() {
  const { scrollY } = useScroll();

  // Add spring physics to parallax for smooth, natural motion
  const y = useSpring(useTransform(scrollY, [0, 1000], [0, -200]), {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="relative h-screen overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }}>
        <img
          alt="Hero"
          className="h-full w-full object-cover"
          src="/images/hero.jpg"
        />
      </motion.div>

      <div className="relative z-10 flex h-full items-center justify-center">
        <h1 className="font-bold text-6xl text-white">Smooth Parallax</h1>
      </div>
    </div>
  );
}

// ============================================================================
// PATTERN 6: Scale on Scroll
// ============================================================================

/**
 * Scale element based on scroll position.
 * Perfect for sticky headers that shrink on scroll.
 */
export function ScaleOnScroll({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();

  // Scale from 1 to 0.8 as user scrolls from 0 to 300px
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  return <motion.div style={{ scale }}>{children}</motion.div>;
}

// ============================================================================
// PATTERN 7: Horizontal Scroll Animation
// ============================================================================

/**
 * Horizontal scroll gallery triggered by vertical scroll.
 * Creates "scroll-jacking" effect like Apple product pages.
 */
export function HorizontalScrollGallery() {
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Convert vertical scroll to horizontal movement
  // 0 → 0%, 1 → -300% (moves 3 screens to the left)
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-300%"]);

  return (
    <section className="relative h-[400vh]" ref={targetRef}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div className="flex h-full" style={{ x }}>
          <div className="flex h-full min-w-full items-center justify-center bg-red-500 text-4xl text-white">
            Panel 1
          </div>
          <div className="flex h-full min-w-full items-center justify-center bg-blue-500 text-4xl text-white">
            Panel 2
          </div>
          <div className="flex h-full min-w-full items-center justify-center bg-green-500 text-4xl text-white">
            Panel 3
          </div>
          <div className="flex h-full min-w-full items-center justify-center bg-purple-500 text-4xl text-white">
            Panel 4
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// PATTERN 8: Rotate on Scroll
// ============================================================================

/**
 * Rotate element based on scroll position.
 * Perfect for decorative elements and logos.
 */
export function RotateOnScroll() {
  const { scrollY } = useScroll();

  // Rotate 360 degrees as user scrolls 1000px
  const rotate = useTransform(scrollY, [0, 1000], [0, 360]);

  return (
    <motion.div
      className="h-32 w-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-600"
      style={{ rotate }}
    />
  );
}

// ============================================================================
// PATTERN 9: Sticky Element with Scroll Effects
// ============================================================================

/**
 * Sticky element that scales and fades as user scrolls past.
 * Perfect for "scroll to continue" indicators.
 */
export function StickyScrollIndicator() {
  const { scrollY } = useScroll();

  // Fade out and scale down after scrolling 200px
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.5]);

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
      style={{ opacity, scale }}
    >
      <div className="flex flex-col items-center text-gray-600">
        <p className="mb-2">Scroll Down</p>
        <svg
          className="h-6 w-6 animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
    </motion.div>
  );
}

// ============================================================================
// PATTERN 10: useInView Hook (Manual Control)
// ============================================================================

/**
 * More control than whileInView prop.
 * Trigger custom animations when element enters viewport.
 */
export function CustomInViewAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  // Returns true when element is in viewport
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
    amount: 0.5,
  });

  return (
    <div className="flex min-h-screen items-center justify-center" ref={ref}>
      <motion.div
        animate={
          isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }
        }
        className="rounded-lg bg-blue-100 p-8"
        initial={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-bold text-2xl">
          {isInView ? "I'm in view!" : "Scroll to me"}
        </h2>
      </motion.div>
    </div>
  );
}

// ============================================================================
// PATTERN 11: Scroll-Linked Color Change
// ============================================================================

/**
 * Change background color based on scroll position.
 * Perfect for section transitions.
 */
export function ScrollColorChange() {
  const { scrollYProgress } = useScroll();

  // Interpolate between colors
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.33, 0.66, 1],
    ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6"] // red → blue → green → purple
  );

  return (
    <motion.div
      className="flex min-h-[200vh] items-center justify-center"
      style={{ backgroundColor }}
    >
      <div className="font-bold text-4xl text-white">
        Background changes as you scroll
      </div>
    </motion.div>
  );
}

// ============================================================================
// ALL EXAMPLES COMPONENT
// ============================================================================

/**
 * Demo page showing all scroll patterns.
 */
export function ScrollAnimationExamples() {
  return (
    <div>
      <ScrollProgressBar />
      <ParallaxHero />
      <FadeInSection>
        <div className="container mx-auto p-8">
          <h2 className="mb-4 font-bold text-4xl">Fade In Section</h2>
          <p className="text-gray-700">
            This section fades in when you scroll to it.
          </p>
        </div>
      </FadeInSection>
      <SectionScrollIndicator />
      <SmoothParallax />
      <div className="container mx-auto p-8">
        <ScaleOnScroll>
          <h2 className="mb-4 font-bold text-4xl">Scale on Scroll</h2>
          <p className="text-gray-700">This scales down as you scroll.</p>
        </ScaleOnScroll>
      </div>
      <HorizontalScrollGallery />
      <div className="container mx-auto flex justify-center p-8">
        <RotateOnScroll />
      </div>
      <StickyScrollIndicator />
      <CustomInViewAnimation />
      <ScrollColorChange />
      <div className="h-screen" /> {/* Spacer to allow scrolling */}
    </div>
  );
}

/**
 * PERFORMANCE TIPS
 *
 * 1. Add willChange for transforms:
 *    <motion.div style={{ willChange: "transform" }} />
 *
 * 2. Use ScrollTimeline API (automatic in Motion):
 *    - Hardware-accelerated
 *    - Runs on compositor thread (no JavaScript on scroll)
 *    - 120fps on capable devices
 *
 * 3. Avoid animating expensive properties:
 *    ✅ Good: transform, opacity
 *    ❌ Bad: width, height, top, left (causes layout reflow)
 *
 * 4. Use useSpring for smooth, natural motion:
 *    const y = useSpring(useTransform(scrollY, [0, 1000], [0, -200]))
 *
 * 5. Debounce complex calculations:
 *    Only update on significant scroll changes, not every pixel
 */

/**
 * ACCESSIBILITY
 *
 * 1. Respect prefers-reduced-motion:
 *
 *    import { MotionConfig } from "motion/react"
 *
 *    <MotionConfig reducedMotion="user">
 *      <ScrollAnimationExamples />
 *    </MotionConfig>
 *
 * 2. Don't rely on scroll animations for critical content:
 *    - Ensure content is visible without JavaScript
 *    - Provide alternative navigation
 *    - Don't hide important UI behind scroll triggers
 *
 * 3. Test with keyboard navigation:
 *    - Tab through page
 *    - Ensure animations don't block keyboard focus
 *
 * See ../references/performance-optimization.md for full guide
 */

/**
 * NEXT.JS USAGE
 *
 * Add "use client" directive at top of file:
 *
 * "use client"
 *
 * import { motion, useScroll, ... } from "motion/react-client"
 *
 * See ../references/nextjs-integration.md for comprehensive guide
 */
