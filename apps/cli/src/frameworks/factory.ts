import type { Framework } from "~/schemas/config";
import type { FrameworkStrategy } from "./types";

const strategyLoaders: Record<Framework, () => Promise<FrameworkStrategy>> = {
  react: async () => (await import("./react/strategy")).reactStrategy,
  preact: async () => (await import("./preact/strategy")).preactStrategy,
  solid: async () => (await import("./solid/strategy")).solidStrategy,
  qwik: async () => (await import("./qwik/strategy")).qwikStrategy,
  vue: async () => (await import("./vue/strategy")).vueStrategy,
  svelte: async () => (await import("./svelte/strategy")).svelteStrategy,
};

/**
 * Factory function to create a framework strategy
 *
 * Uses dynamic import to load only the needed framework code,
 * enabling code splitting in the bundled output.
 */
export function createFrameworkStrategy(
  name: Framework
): Promise<FrameworkStrategy> {
  return strategyLoaders[name]();
}
