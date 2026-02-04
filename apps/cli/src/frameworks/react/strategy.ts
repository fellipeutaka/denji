import { enhancedConfirm } from "~/utils/prompts";
import type {
  FrameworkStrategy,
  PromptContext,
  TemplateConfig,
} from "../types";
import { type ReactOptions, reactOptionsSchema } from "./schema";

function getIconType(forwardRef: boolean): string {
  if (forwardRef) {
    return 'export type Icon = React.ForwardRefExoticComponent<IconProps & React.ComponentRef<"svg">>;';
  }
  return "export type Icon = (props: IconProps) => React.JSX.Element;";
}

function getIconsTemplate(config: TemplateConfig): string {
  const opts = config.frameworkOptions as ReactOptions;
  const forwardRef = opts?.forwardRef ?? false;

  if (config.typescript) {
    const iconType = getIconType(forwardRef);
    return `export type IconProps = React.ComponentProps<"svg">;
${iconType}

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
`;
  }

  return `export const Icons = {};
`;
}

export const reactStrategy: FrameworkStrategy = {
  name: "react",

  fileExtensions: {
    typescript: ".tsx",
    javascript: ".jsx",
  },

  optionsSchema: reactOptionsSchema,

  supportsRef: true,

  getIconsTemplate,

  getImports(options: ReactOptions) {
    if (options?.forwardRef) {
      return ['import { forwardRef } from "react";'];
    }
    return [];
  },

  getForwardRefImportSource() {
    return "react";
  },

  isForwardRefEnabled(options: ReactOptions) {
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
    return "react";
  },
};
