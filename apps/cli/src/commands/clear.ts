import path from "node:path";
import { cancel, intro, outro } from "@clack/prompts";
import { Command } from "commander";
import type { FrameworkOptions } from "~/frameworks/types";
import type { Config } from "~/schemas/config";
import { clearDefaults } from "~/services/defaults";
import type { ClearDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { CANCEL_MESSAGE } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

export interface ClearOptions {
  cwd: string;
  yes: boolean;
}

export class ClearCommand {
  constructor(private readonly deps: ClearDeps) {}

  async run(options: ClearOptions) {
    const { fs, config, hooks, icons, prompts, logger, frameworks } = this.deps;

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

    const iconsContent = iconsFileResult.value;
    const existingIcons = icons.getExistingIconNames(iconsContent);

    // 5. Check if there are any icons to remove
    if (existingIcons.length === 0) {
      logger.info("No icons to remove");
      return new Ok(null);
    }

    // 6. Confirm action unless --yes flag is provided
    if (!options.yes) {
      const shouldContinue = await prompts.confirm({
        message: `Remove all ${existingIcons.length} icon(s)?`,
        initialValue: false,
      });

      if (!shouldContinue) {
        cancel(CANCEL_MESSAGE);
      }
    }

    // 7. Run preClear hooks
    const preClearResult = await hooks.runHooks(
      cfg.hooks?.preClear,
      options.cwd
    );
    if (preClearResult.isErr()) {
      return preClearResult;
    }

    // 8. Reset to template using strategy
    const frameworkOptions =
      (cfg[strategy.getConfigKey() as keyof Config] as FrameworkOptions) ?? {};
    const template = strategy.getIconsTemplate({
      typescript: cfg.typescript,
      frameworkOptions,
    });
    const writeResult = await fs.writeFile(iconsPath, template);
    if (writeResult.isErr()) {
      return new Err(`Failed to write icons file: ${cfg.output}`);
    }

    // 9. Run postClear hooks
    const postClearResult = await hooks.runHooks(
      cfg.hooks?.postClear,
      options.cwd
    );
    if (postClearResult.isErr()) {
      return postClearResult;
    }

    return new Ok(null);
  }
}

export function createClearCommand(): ClearCommand {
  return new ClearCommand(clearDefaults);
}

export const clear = new Command()
  .name("clear")
  .description("Remove all icons from your project")
  .aliases(["clr", "reset"])
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .option("-y, --yes", "Skip confirmation prompt", false)
  .action(async (options: ClearOptions) => {
    intro("denji clear");

    const command = createClearCommand();

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro("All icons removed");
  });
