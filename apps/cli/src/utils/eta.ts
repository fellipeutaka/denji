import { Eta } from "eta";

/**
 * Shared Eta instance for template rendering.
 * Uses cache mode with @ prefix for inline templates.
 */
export const eta = new Eta({
  cache: true,
  autoEscape: false,
  autoTrim: false,
});
