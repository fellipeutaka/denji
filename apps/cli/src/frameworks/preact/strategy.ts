import { transform } from "@svgr/core";
import { eta } from "~/utils/eta";
import { enhancedConfirm } from "~/utils/prompts";
import {
  getA11yAttrs,
  SVG_OPENING_TAG_REGEX,
  SVG_TAG_REGEX,
  toReadableName,
} from "~/utils/svg";
import type {
  FrameworkStrategy,
  PromptContext,
  TemplateConfig,
  TransformSvgOptions,
} from "../types";
import { type PreactOptions, preactOptionsSchema } from "./schema";

const ICONS_TEMPLATE = `<% if (it.typescript) { -%>
import type * as preact from "preact/compat";

export type IconProps = preact.ComponentProps<"svg">;
<% if (it.forwardRef) { -%>
export type Icon = preact.ForwardRefExoticComponent<IconProps & preact.RefAttributes<SVGSVGElement>>;
<% } else { -%>
export type Icon = (props: IconProps) => preact.JSX.Element;
<% } -%>

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
<% } else { -%>
export const Icons = {};
<% } -%>
`;

const FOLDER_TEMPLATE = `import type { ComponentProps, JSX } from "preact";

export type IconProps = ComponentProps<"svg">;

export function <%= it.componentName %>(props: IconProps): JSX.Element {
  return <%= it.svg %>;
}
`;

const FOLDER_FORWARDREF_TEMPLATE = `import { forwardRef, type ComponentProps, type ComponentRef } from "preact/compat";

export type IconProps = ComponentProps<"svg">;

export const <%= it.componentName %> = forwardRef<SVGSVGElement, IconProps>(
  function <%= it.componentName %>(props, ref) {
    return <%= it.svg %>;
  }
);

<%= it.componentName %>.displayName = "<%= it.componentName %>";
`;

eta.loadTemplate("@preact/icons", ICONS_TEMPLATE);
eta.loadTemplate("@preact/folder", FOLDER_TEMPLATE);
eta.loadTemplate("@preact/folder-forwardref", FOLDER_FORWARDREF_TEMPLATE);

function getIconsTemplate(config: TemplateConfig): string {
  const opts = config.frameworkOptions as PreactOptions;
  const forwardRef = opts?.forwardRef ?? false;

  return eta.render("@preact/icons", {
    typescript: config.typescript,
    forwardRef,
  });
}

/**
 * Transform SVG to Preact component using SVGR
 * Outputs camelCase attributes for JSX compatibility
 */
async function transformSvg(
  svg: string,
  options: TransformSvgOptions,
  frameworkOptions: PreactOptions
): Promise<string> {
  const { a11y, trackSource, iconName, componentName, outputMode } = options;
  const forwardRef = frameworkOptions?.forwardRef ?? false;
  const isFolderMode = outputMode === "folder";

  const svgProps: Record<string, string> = getA11yAttrs(a11y, componentName);

  if (trackSource && iconName) {
    svgProps["data-icon"] = iconName;
  }

  const jsCode = await transform(
    svg,
    {
      plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
      svgoConfig: {
        plugins: [
          "preset-default",
          "convertStyleToAttrs",
          "sortAttrs",
          "mergePaths",
        ],
      },
      jsxRuntime: "automatic",
      typescript: false,
      expandProps: "end",
      svgProps,
      titleProp: a11y === "title",
    },
    { componentName: "Icon" }
  );

  // Extract just the SVG JSX from the generated component
  const svgMatch = jsCode.match(SVG_TAG_REGEX);
  if (!svgMatch) {
    throw new Error("Failed to extract SVG from SVGR output");
  }

  let result = svgMatch[0];

  // For title mode, inject the title element with the readable name
  if (a11y === "title") {
    const readableName = toReadableName(componentName);
    result = result.replace(
      SVG_OPENING_TAG_REGEX,
      `<svg$1><title>${readableName}</title>`
    );
  }

  if (isFolderMode) {
    // Folder mode: generate standalone named export
    if (forwardRef) {
      result = result.replace(SVG_OPENING_TAG_REGEX, "<svg$1 ref={ref}>");
      return eta.render("@preact/folder-forwardref", {
        componentName,
        svg: result,
      });
    }
    return eta.render("@preact/folder", {
      componentName,
      svg: result,
    });
  }

  // File mode: generate object property
  if (forwardRef) {
    result = result.replace(SVG_OPENING_TAG_REGEX, "<svg$1 ref={ref}>");
    return `${componentName}: forwardRef<SVGSVGElement, IconProps>((props, ref) => (${result}))`;
  }

  return `${componentName}: (props) => (${result})`;
}

export const preactStrategy: FrameworkStrategy = {
  name: "preact",

  fileExtensions: {
    typescript: ".tsx",
    javascript: ".jsx",
  },

  optionsSchema: preactOptionsSchema,

  supportsRef: true,

  preferredOutputType: "file",

  getIconsTemplate,

  getImports(options: PreactOptions) {
    if (options?.forwardRef) {
      return ['import { forwardRef } from "preact/compat";'];
    }
    return [];
  },

  getForwardRefImportSource() {
    return "preact/compat";
  },

  isForwardRefEnabled(options: PreactOptions) {
    return options?.forwardRef === true;
  },

  async promptOptions(context: PromptContext) {
    const forwardRef =
      context.forwardRef ??
      (await enhancedConfirm({
        message: "Use forwardRef for icon components?",
        initialValue: false,
      }));

    return { forwardRef };
  },

  getConfigKey() {
    return "preact";
  },

  transformSvg,
};
