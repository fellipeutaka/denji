import type { FrameworkOptions } from "~/frameworks/types";
import { generateTypes } from "~/utils/icons-folder";
import {
  getA11yAttrs,
  injectSvgAttrs,
  injectSvgTitle,
  optimizeSvg,
  SVG_OPENING_TAG_REGEX,
  toReadableName,
} from "~/utils/svg";
import type {
  FrameworkStrategy,
  TemplateConfig,
  TransformSvgOptions,
} from "../types";
import { type SvelteOptions, svelteOptionsSchema } from "./schema";

function getIconsTemplate(config: TemplateConfig): string {
  if (config.typescript) {
    return `export const Icons = {} as const;

export type IconName = keyof typeof Icons;
`;
  }
  return "export const Icons = {};\n";
}

/**
 * Core SVG transform — optimizes, injects attrs, adds props spread.
 * Returns the processed SVG markup (no script block).
 */
function processSvg(svg: string, options: TransformSvgOptions): string {
  const { a11y, trackSource, iconName, componentName } = options;

  let result = optimizeSvg(svg);

  const extraAttrs: Record<string, string> = getA11yAttrs(a11y, componentName);

  if (trackSource && iconName) {
    extraAttrs["data-icon"] = iconName;
  }

  if (Object.keys(extraAttrs).length > 0) {
    result = injectSvgAttrs(result, extraAttrs);
  }

  if (a11y === "title") {
    const readableName = toReadableName(componentName);
    result = injectSvgTitle(result, readableName);
  }

  // Add Svelte props spread
  result = result.replace(SVG_OPENING_TAG_REGEX, "<svg$1 {...props}>");

  return result;
}

/**
 * Transform SVG to Svelte 5 component (.svelte file).
 * TS mode adds typed $props(), JS mode uses untyped $props().
 */
// biome-ignore lint/suspicious/useAwait: This need to be async to match the FrameworkStrategy type, even though we don't have any async work here currently.
async function transformSvg(
  svg: string,
  options: TransformSvgOptions,
  frameworkOptions: FrameworkOptions
): Promise<string> {
  const markup = processSvg(svg, options);
  const useTs =
    (frameworkOptions as { typescript?: boolean }).typescript !== false;

  let scriptBlock: string;
  if (useTs) {
    scriptBlock = [
      '<script lang="ts">',
      '  import type { SVGAttributes } from "svelte/elements";',
      "",
      "  type $$Props = SVGAttributes<SVGSVGElement>;",
      "",
      "  let { ...props }: $$Props = $props();",
      "</script>",
    ].join("\n");
  } else {
    scriptBlock = [
      "<script>",
      "  let { ...props } = $props();",
      "</script>",
    ].join("\n");
  }

  return `${scriptBlock}\n\n${markup}\n`;
}

export const svelteStrategy: FrameworkStrategy = {
  name: "svelte",

  fileExtensions: {
    typescript: ".svelte",
    javascript: ".svelte",
  },

  optionsSchema: svelteOptionsSchema,

  supportsRef: false,

  preferredOutputType: "folder",

  getIconsTemplate,

  getForwardRefImportSource() {
    return "svelte";
  },

  isForwardRefEnabled(_options: SvelteOptions) {
    return false;
  },

  // biome-ignore lint/suspicious/useAwait: This needs to be async to match the FrameworkStrategy type, even though we don't have any async work here currently.
  async promptOptions() {
    return {};
  },

  getConfigKey() {
    return "svelte";
  },

  getTypesFileContent() {
    return generateTypes(
      "SVGAttributes<SVGSVGElement>",
      'import type { SVGAttributes } from "svelte/elements";'
    );
  },

  transformSvg,
};
