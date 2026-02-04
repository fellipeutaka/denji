import { type Config, optimize } from "svgo";
import type { A11y } from "~/schemas/config";

/**
 * SVGO configuration for optimizing SVGs
 */
const SVGO_CONFIG: Config = {
  plugins: ["preset-default", "convertStyleToAttrs", "sortAttrs", "mergePaths"],
};

/**
 * Optimize SVG using SVGO
 */
export function optimizeSvg(svg: string): string {
  const result = optimize(svg, SVGO_CONFIG);
  return result.data;
}

/**
 * Convert component name to readable format for a11y
 * "HomeIcon" → "Home Icon"
 */
export function toReadableName(componentName: string): string {
  return componentName.replace(/([a-z])([A-Z])/g, "$1 $2");
}

/**
 * Get a11y attributes based on strategy
 */
export function getA11yAttrs(
  a11y: A11y | undefined,
  componentName: string
): Record<string, string> {
  switch (a11y) {
    case "hidden":
      return { "aria-hidden": "true" };
    case "img":
      return { role: "img", "aria-label": toReadableName(componentName) };
    case "presentation":
      return { role: "presentation" };
    default:
      return {};
  }
}

/**
 * Regex to match the full SVG tag
 */
export const SVG_TAG_REGEX = /<svg[\s\S]*<\/svg>/;

/**
 * Regex to match SVG opening tag and capture its attributes
 */
export const SVG_OPENING_TAG_REGEX = /<svg([^>]*)>/;

/**
 * Inject attributes into SVG opening tag
 */
export function injectSvgAttrs(
  svg: string,
  attrs: Record<string, string>
): string {
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  if (!attrString) {
    return svg;
  }

  return svg.replace(SVG_OPENING_TAG_REGEX, `<svg$1 ${attrString}>`);
}

/**
 * Inject a title element after the SVG opening tag
 */
export function injectSvgTitle(svg: string, title: string): string {
  return svg.replace(SVG_OPENING_TAG_REGEX, `<svg$1><title>${title}</title>`);
}
