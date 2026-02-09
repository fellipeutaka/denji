import { eta } from "~/utils/eta";
import {
  getA11yAttrs,
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
import { type QwikOptions, qwikOptionsSchema } from "./schema";

const ICONS_TEMPLATE = `<% if (it.typescript) { -%>
import type { PropsOf, JSX } from "@builder.io/qwik";

export type IconProps = PropsOf<"svg">;
export type Icon = (props: IconProps) => JSX.Element;

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
<% } else { -%>
export const Icons = {};
<% } -%>
`;

const FOLDER_TEMPLATE = `import { component$ } from "@builder.io/qwik";
import type { PropsOf } from "@builder.io/qwik";

export type IconProps = PropsOf<"svg">;

export const <%= it.componentName %> = component$<IconProps>((props) => {
  return <%= it.svg %>;
});
`;

eta.loadTemplate("@qwik/icons", ICONS_TEMPLATE);
eta.loadTemplate("@qwik/folder", FOLDER_TEMPLATE);

function getIconsTemplate(config: TemplateConfig): string {
  return eta.render("@qwik/icons", {
    typescript: config.typescript,
  });
}

/**
 * Transform SVG to Qwik component
 * Uses native HTML attributes (kebab-case) since Qwik prefers them
 */
// biome-ignore lint/suspicious/useAwait: This need to be async to match the FrameworkStrategy type, even though we don't have any async work here currently.
async function transformSvg(
  svg: string,
  options: TransformSvgOptions
): Promise<string> {
  const { a11y, trackSource, iconName, componentName, outputMode } = options;
  const isFolderMode = outputMode === "folder";

  // Optimize SVG with SVGO (keeps kebab-case attributes)
  let result = optimizeSvg(svg);

  // Build extra attributes
  const extraAttrs: Record<string, string> = getA11yAttrs(a11y, componentName);

  if (trackSource && iconName) {
    extraAttrs["data-icon"] = iconName;
  }

  // Inject extra attributes into SVG opening tag
  if (Object.keys(extraAttrs).length > 0) {
    const attrString = Object.entries(extraAttrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    result = result.replace(SVG_OPENING_TAG_REGEX, `<svg$1 ${attrString}>`);
  }

  // For title mode, inject the title element
  if (a11y === "title") {
    const readableName = toReadableName(componentName);
    result = injectSvgTitle(result, readableName);
  }

  // Add props spreading
  result = result.replace(SVG_OPENING_TAG_REGEX, "<svg$1 {...props}>");

  if (isFolderMode) {
    // Folder mode: generate component$() wrapped export
    return eta.render("@qwik/folder", {
      componentName,
      svg: result,
    });
  }

  // File mode: generate object property (plain arrow function)
  return `${componentName}: (props) => (${result})`;
}

export const qwikStrategy: FrameworkStrategy = {
  name: "qwik",

  fileExtensions: {
    typescript: ".tsx",
    javascript: ".jsx",
  },

  optionsSchema: qwikOptionsSchema,

  supportsRef: true,

  preferredOutputType: "file",

  getIconsTemplate,

  getForwardRefImportSource() {
    return "@builder.io/qwik";
  },

  isForwardRefEnabled(_options: QwikOptions) {
    // Qwik doesn't use forwardRef pattern
    return false;
  },

  // biome-ignore lint/suspicious/useAwait: This needs to be async to match the FrameworkStrategy type, even though we don't have any async work here currently.
  async promptOptions() {
    // Qwik has no framework-specific options to prompt for
    return {};
  },

  getConfigKey() {
    return "qwik";
  },

  transformSvg,
};
