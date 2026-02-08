import type { Framework } from "~/schemas/config";

/**
 * Metadata for framework selection in prompts
 */
export interface FrameworkMeta {
  value: Framework;
  label: string;
}

/**
 * Registry of all supported frameworks
 *
 * Used for prompt options and validation.
 * Add new frameworks here when implementing them.
 */
export const frameworkRegistry: FrameworkMeta[] = [
  { value: "react", label: "React" },
  { value: "preact", label: "Preact" },
  { value: "solid", label: "Solid" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
];

/**
 * Display name lookup (e.g., "react" → "React", "vue" → "Vue")
 */
export const frameworkDisplayNames: Record<Framework, string> =
  Object.fromEntries(
    frameworkRegistry.map(({ value, label }) => [value, label])
  ) as Record<Framework, string>;

/**
 * Get framework options for select prompts
 */
export function getFrameworkOptions() {
  return frameworkRegistry.map(({ value, label }) => ({ value, label }));
}
