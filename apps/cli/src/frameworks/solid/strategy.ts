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
import { type SolidOptions, solidOptionsSchema } from "./schema";

const ICONS_TEMPLATE = `<% if (it.typescript) { -%>
import type { ComponentProps, JSX } from "solid-js";

export type IconProps = ComponentProps<"svg">;
export type Icon = (props: IconProps) => JSX.Element;

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
<% } else { -%>
export const Icons = {};
<% } -%>
`;

const FOLDER_TEMPLATE = `import type { ComponentProps, JSX } from "solid-js";

export type IconProps = ComponentProps<"svg">;

export function <%= it.componentName %>(props: IconProps): JSX.Element {
  return <%= it.svg %>;
}
`;

eta.loadTemplate("@solid/icons", ICONS_TEMPLATE);
eta.loadTemplate("@solid/folder", FOLDER_TEMPLATE);

function getIconsTemplate(config: TemplateConfig): string {
  return eta.render("@solid/icons", {
    typescript: config.typescript,
  });
}

/**
 * Transform SVG to Solid component
 * Uses native HTML attributes (kebab-case) since Solid supports them
 */
function transformSvg(
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

  // Add props spreading - Solid uses native spread syntax
  result = result.replace(SVG_OPENING_TAG_REGEX, "<svg$1 {...props}>");

  if (isFolderMode) {
    // Folder mode: generate standalone named export
    return Promise.resolve(
      eta.render("@solid/folder", {
        componentName,
        svg: result,
      })
    );
  }

  // File mode: generate object property
  return Promise.resolve(`${componentName}: (props) => (${result})`);
}

export const solidStrategy: FrameworkStrategy = {
  name: "solid",

  fileExtensions: {
    typescript: ".tsx",
    javascript: ".jsx",
  },

  optionsSchema: solidOptionsSchema,

  supportsRef: true,

  preferredOutputType: "file",

  getIconsTemplate,

  getImports(_options: SolidOptions) {
    // Solid doesn't need forwardRef import - refs work as regular props
    return [];
  },

  getForwardRefImportSource() {
    return "solid-js";
  },

  isForwardRefEnabled(_options: SolidOptions) {
    // Solid doesn't use forwardRef pattern
    return false;
  },

  promptOptions() {
    // Solid has no framework-specific options to prompt for
    return Promise.resolve({});
  },

  getConfigKey() {
    return "solid";
  },

  transformSvg,
};
