import path from "node:path";
import { createEta } from "~/utils/eta";
import { enhancedConfirm } from "~/utils/prompts";
import type {
  FrameworkStrategy,
  PromptContext,
  TemplateConfig,
} from "../types";
import { type ReactOptions, reactOptionsSchema } from "./schema";

const eta = createEta(path.join(import.meta.dirname, "templates"));

function getIconsTemplate(config: TemplateConfig): string {
  const opts = config.frameworkOptions as ReactOptions;
  const forwardRef = opts?.forwardRef ?? false;

  return eta.render("./icons", {
    typescript: config.typescript,
    forwardRef,
  });
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
