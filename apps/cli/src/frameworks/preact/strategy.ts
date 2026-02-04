import { enhancedConfirm } from "~/utils/prompts";
import type {
  FrameworkStrategy,
  PromptContext,
  TemplateConfig,
} from "../types";
import { type PreactOptions, preactOptionsSchema } from "./schema";

function getIconType(forwardRef: boolean): string {
  if (forwardRef) {
    return "export type Icon = preact.ForwardRefExoticComponent<IconProps & preact.RefAttributes<SVGSVGElement>>;";
  }
  return "export type Icon = (props: IconProps) => preact.JSX.Element;";
}

function getIconsTemplate(config: TemplateConfig): string {
  const opts = config.frameworkOptions as PreactOptions;
  const forwardRef = opts?.forwardRef ?? false;

  if (config.typescript) {
    const iconType = getIconType(forwardRef);
    return `import type * as preact from "preact/compat";

export type IconProps = preact.ComponentProps<"svg">;
${iconType}

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
`;
  }

  return `export const Icons = {};
`;
}

export const preactStrategy: FrameworkStrategy = {
  name: "preact",

  fileExtensions: {
    typescript: ".tsx",
    javascript: ".jsx",
  },

  optionsSchema: preactOptionsSchema,

  supportsRef: true,

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
};
