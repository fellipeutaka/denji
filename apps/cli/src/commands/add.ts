import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import type { FrameworkOptions } from "~/frameworks/types";
import { type A11y, a11ySchema, type Config } from "~/schemas/config";
import { addDefaults } from "~/services/defaults";
import type { AddDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err } from "~/utils/result";

export interface AddOptions {
  cwd: string;
  name?: string;
  a11y?: string | boolean;
}

export class AddCommand {
  constructor(private readonly deps: AddDeps) {}

  async run(icons: string[], options: AddOptions) {
    const { fs, config, hooks, icons: iconUtils, frameworks } = this.deps;

    // 1. Validate cwd exists
    if (!(await fs.access(options.cwd))) {
      return new Err(`Directory does not exist: ${options.cwd}`);
    }

    // 2. Validate --name with multiple icons
    if (options.name && icons.length > 1) {
      return new Err("--name can only be used with a single icon");
    }

    // 3. Validate all icon names
    for (const icon of icons) {
      const validation = iconUtils.validateIconName(icon);
      if (validation.isErr()) {
        return validation;
      }
    }

    // 4. Validate --a11y if provided
    let a11yOverride: A11y | undefined;
    if (options.a11y !== undefined) {
      const a11yInput = options.a11y === "false" ? false : options.a11y;
      const a11yResult = a11ySchema.safeParse(a11yInput);
      if (!a11yResult.success) {
        return new Err(
          `Invalid a11y strategy: ${options.a11y}. Use: hidden, img, title, presentation, false`
        );
      }
      a11yOverride = a11yResult.data;
    }

    // 5. Load config
    const configResult = await config.loadConfig(options.cwd);
    if (configResult.isErr()) {
      return configResult;
    }
    const cfg = configResult.value;

    // 6. Load framework strategy
    const strategy = await frameworks.createStrategy(cfg.framework);

    // 7. Run preAdd hooks
    const preAddResult = await hooks.runHooks(cfg.hooks?.preAdd, options.cwd);
    if (preAddResult.isErr()) {
      return preAddResult;
    }

    // Get framework-specific options
    const frameworkOptions =
      (cfg[strategy.getConfigKey() as keyof Config] as FrameworkOptions) ?? {};

    const runMode =
      cfg.output.type === "folder"
        ? this.deps.runFolderMode
        : this.deps.runFileMode;

    return runMode(
      icons,
      options,
      cfg,
      strategy,
      frameworkOptions,
      a11yOverride,
      this.deps
    );
  }
}

export const add = new Command()
  .name("add")
  .description("Add icons to your project")
  .argument("<icons...>", "Icon names (e.g., mdi:home lucide:check)")
  .option("--name <name>", "Custom component name (single icon only)")
  .option("--a11y <strategy>", "Accessibility strategy (overrides config)")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (icons: string[], options: AddOptions) => {
    intro("denji add");

    const command = new AddCommand(addDefaults);

    const result = await command.run(icons, options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro(`Added ${icons.length} icon(s)`);
  });
