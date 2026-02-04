import type { Framework } from "~/schemas/config";
import type { FrameworkStrategy } from "./types";

/**
 * Factory function to create a framework strategy
 *
 * Uses dynamic import to load only the needed framework code,
 * enabling code splitting in the bundled output.
 */
export async function createFrameworkStrategy(
  name: Framework
): Promise<FrameworkStrategy> {
  switch (name) {
    case "react": {
      const { reactStrategy } = await import("./react/strategy");
      return reactStrategy;
    }
    case "preact": {
      const { preactStrategy } = await import("./preact/strategy");
      return preactStrategy;
    }
    default: {
      throw new Error(`Unknown framework: ${name}`);
    }
  }
}
