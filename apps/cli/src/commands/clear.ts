import path from "node:path";
import { cancel, intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { getIconsTemplate } from "~/templates/icons";
import { loadConfig } from "~/utils/config";
import { access, readFile, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { runHooks } from "~/utils/hooks";
import { getExistingIconNames } from "~/utils/icons";
import { logger } from "~/utils/logger";
import { CANCEL_MESSAGE, enhancedConfirm } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

export interface ClearOptions {
  cwd: string;
  yes: boolean;
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

    const command = new ClearCommand();

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro("All icons removed");
  });

export class ClearCommand {
  async run(options: ClearOptions) {
    // 1. Validate cwd exists
    if (!(await access(options.cwd))) {
      return new Err(`Directory does not exist: ${options.cwd}`);
    }

    // 2. Load config
    const configResult = await loadConfig(options.cwd);
    if (configResult.isErr()) {
      return configResult;
    }
    const config = configResult.value;

    // 3. Read icons file
    const iconsPath = path.resolve(options.cwd, config.output);
    if (!(await access(iconsPath))) {
      return new Err(
        `Icons file not found: ${config.output}. Run "denji init" first.`
      );
    }

    const iconsFileResult = await readFile(iconsPath, "utf-8");
    if (iconsFileResult.isErr()) {
      return new Err(`Failed to read icons file: ${config.output}`);
    }

    const iconsContent = iconsFileResult.value;
    const existingIcons = getExistingIconNames(iconsContent);

    // 4. Check if there are any icons to remove
    if (existingIcons.length === 0) {
      logger.info("No icons to remove");
      return new Ok(null);
    }

    // 5. Confirm action unless --yes flag is provided
    if (!options.yes) {
      const shouldContinue = await enhancedConfirm({
        message: `Remove all ${existingIcons.length} icon(s)?`,
        initialValue: false,
      });

      if (!shouldContinue) {
        cancel(CANCEL_MESSAGE);
      }
    }

    // 6. Run preClear hooks
    const preClearResult = await runHooks(config.hooks?.preClear, options.cwd);
    if (preClearResult.isErr()) {
      return preClearResult;
    }

    // 7. Reset to template
    const writeResult = await writeFile(iconsPath, getIconsTemplate(config));
    if (writeResult.isErr()) {
      return new Err(`Failed to write icons file: ${config.output}`);
    }

    // 8. Run postClear hooks
    const postClearResult = await runHooks(
      config.hooks?.postClear,
      options.cwd
    );
    if (postClearResult.isErr()) {
      return postClearResult;
    }

    return new Ok(null);
  }
}
