import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import type { FrameworkOptions } from "~/frameworks/types";
import type { Config } from "~/schemas/config";
import { removeDefaults } from "~/services/defaults";
import type { RemoveDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err, Ok } from "~/utils/result";

export interface RemoveOptions {
  cwd: string;
}

export class RemoveCommand {
  constructor(private readonly deps: RemoveDeps) {}

  async run(icons: string[], options: RemoveOptions) {
    const {
      fs,
      config,
      hooks,
      icons: iconUtils,
      logger,
      frameworks,
    } = this.deps;

    // 1. Validate cwd exists
    if (!(await fs.access(options.cwd))) {
      return new Err(`Directory does not exist: ${options.cwd}`);
    }

    // 2. Load config
    const configResult = await config.loadConfig(options.cwd);
    if (configResult.isErr()) {
      return configResult;
    }
    const cfg = configResult.value;

    // 3. Load framework strategy
    const strategy = await frameworks.createStrategy(cfg.framework);

    // 4. Read icons file
    const iconsPath = path.resolve(options.cwd, cfg.output);
    if (!(await fs.access(iconsPath))) {
      return new Err(
        `Icons file not found: ${cfg.output}. Run "denji init" first.`
      );
    }

    const iconsFileResult = await fs.readFile(iconsPath, "utf-8");
    if (iconsFileResult.isErr()) {
      return new Err(`Failed to read icons file: ${cfg.output}`);
    }

    let iconsContent = iconsFileResult.value;
    const existingIcons = iconUtils.getExistingIconNames(iconsContent);

    // 5. Validate all icons exist
    const notFound: string[] = [];
    for (const icon of icons) {
      if (!existingIcons.includes(icon)) {
        notFound.push(icon);
      }
    }

    if (notFound.length > 0) {
      return new Err(`Icon(s) not found: ${notFound.join(", ")}`);
    }

    // 6. Run preRemove hooks
    const preRemoveResult = await hooks.runHooks(
      cfg.hooks?.preRemove,
      options.cwd
    );
    if (preRemoveResult.isErr()) {
      return preRemoveResult;
    }

    // 7. Check if removing all icons - reset to template
    const remainingCount = existingIcons.length - icons.length;
    if (remainingCount === 0) {
      const frameworkOptions =
        (cfg[strategy.getConfigKey() as keyof Config] as FrameworkOptions) ??
        {};
      const template = strategy.getIconsTemplate({
        typescript: cfg.typescript,
        frameworkOptions,
      });
      const writeResult = await fs.writeFile(iconsPath, template);
      if (writeResult.isErr()) {
        return new Err(`Failed to write icons file: ${cfg.output}`);
      }
      for (const icon of icons) {
        logger.success(`Removed ${icon}`);
      }
      const postRemoveResult = await hooks.runHooks(
        cfg.hooks?.postRemove,
        options.cwd
      );
      if (postRemoveResult.isErr()) {
        return postRemoveResult;
      }
      return new Ok(null);
    }

    // 8. Remove icons one by one
    for (const icon of icons) {
      iconsContent = iconUtils.removeIcon(iconsContent, icon);
      logger.success(`Removed ${icon}`);
    }

    // 9. Write updated file
    const writeResult = await fs.writeFile(iconsPath, iconsContent);
    if (writeResult.isErr()) {
      return new Err(`Failed to write icons file: ${cfg.output}`);
    }

    // 10. Run postRemove hooks
    const postRemoveResult = await hooks.runHooks(
      cfg.hooks?.postRemove,
      options.cwd
    );
    if (postRemoveResult.isErr()) {
      return postRemoveResult;
    }

    return new Ok(null);
  }
}

export function createRemoveCommand(): RemoveCommand {
  return new RemoveCommand(removeDefaults);
}

export const remove = new Command()
  .name("remove")
  .description("Remove icons from your project")
  .argument("<icons...>", "Icon component names (e.g., Home Check)")
  .aliases(["rm", "delete", "del"])
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (icons: string[], options: RemoveOptions) => {
    intro("denji remove");

    const command = createRemoveCommand();

    const result = await command.run(icons, options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro(`Removed ${icons.length} icon(s)`);
  });
