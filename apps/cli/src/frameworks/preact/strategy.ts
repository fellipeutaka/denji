import path from "node:path";
import { createEta } from "~/utils/eta";
import { enhancedConfirm } from "~/utils/prompts";
import type {
  FrameworkStrategy,
  PromptContext,
  TemplateConfig,
} from "../types";
import { type PreactOptions, preactOptionsSchema } from "./schema";

const eta = createEta(path.join(import.meta.dirname, "templates"));

function getIconsTemplate(config: TemplateConfig): string {
  const opts = config.frameworkOptions as PreactOptions;
  const forwardRef = opts?.forwardRef ?? false;

  return eta.render("./icons", {
    typescript: config.typescript,
    forwardRef,
  });
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
