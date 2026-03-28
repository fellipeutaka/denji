import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import type { FrameworkOptions } from "~/frameworks/types";
import { type A11y, a11ySchema, type Config } from "~/schemas/config";
import { addDefaults } from "~/services/defaults";
import type { AddDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { resolveContext } from "~/utils/resolve-context";
import { Err } from "~/utils/result";

export interface AddOptions {
  a11y?: string | boolean;
  cwd: string;
  dryRun?: boolean;
  name?: string;
}

export class AddCommand {
  constructor(private readonly deps: AddDeps) {}

  async run(icons: string[], options: AddOptions) {
    const { hooks, icons: iconUtils } = this.deps;

    // 1. Validate --name with multiple icons
    if (options.name && icons.length > 1) {
      return new Err("--name can only be used with a single icon");
    }

    // 2. Validate all icon names
    for (const icon of icons) {
      const validation = iconUtils.validateIconName(icon);
      if (validation.isErr()) {
        return validation;
      }
    }

    // 3. Validate --a11y if provided
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

    // 4. Resolve config + strategy
    const ctxResult = await resolveContext(this.deps, options.cwd);
    if (ctxResult.isErr()) {
      return ctxResult;
    }
    const { cfg, strategy } = ctxResult.value;

    // 5. Validate icons against allowedLibraries
    if (cfg.allowedLibraries && cfg.allowedLibraries.length > 0) {
      for (const icon of icons) {
        const prefix = icon.split(":")[0] as string;
        if (!cfg.allowedLibraries.includes(prefix)) {
          return new Err(
            `Icon "${icon}" is not allowed. Allowed libraries: ${cfg.allowedLibraries.join(", ")}`
          );
        }
      }
    }

    // 6. Run preAdd hooks (skipped in dry-run)
    if (!options.dryRun) {
      const preAddResult = await hooks.runHooks(
        cfg.hooks?.preAdd ?? [],
        options.cwd
      );
      if (preAddResult.isErr()) {
        return preAddResult;
      }
    }

    // Get framework-specific options
    const frameworkOptions =
      (cfg[strategy.getConfigKey() as keyof Config] as FrameworkOptions) ?? {};

    const runMode =
      cfg.output.type === "folder"
        ? this.deps.runFolderMode
        : this.deps.runFileMode;

    return runMode(
      {
        icons,
        options,
        cfg,
        strategy,
        frameworkOptions,
        a11yOverride,
      },
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
  .option("--dry-run", "Preview what would be generated without writing files")
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

    outro(
      options.dryRun
        ? `Dry run complete — ${icons.length} icon(s) previewed, no files written`
        : `Added ${icons.length} icon(s)`
    );
  });
