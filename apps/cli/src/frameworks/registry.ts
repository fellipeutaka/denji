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
];

/**
 * Get framework options for select prompts
 */
export function getFrameworkOptions() {
  return frameworkRegistry.map(({ value, label }) => ({ value, label }));
}
