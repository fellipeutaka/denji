import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { getIconsTemplate } from "~/templates/icons";
import { loadConfig } from "~/utils/config";
import { access, readFile, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { runHooks } from "~/utils/hooks";
import { getExistingIconNames, removeIcon } from "~/utils/icons";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";

export interface RemoveOptions {
  cwd: string;
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

    const command = new RemoveCommand();

    const result = await command.run(icons, options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro(`Removed ${icons.length} icon(s)`);
  });

export class RemoveCommand {
  async run(icons: string[], options: RemoveOptions) {
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

    let iconsContent = iconsFileResult.value;
    const existingIcons = getExistingIconNames(iconsContent);

    // 4. Validate all icons exist
    const notFound: string[] = [];
    for (const icon of icons) {
      if (!existingIcons.includes(icon)) {
        notFound.push(icon);
      }
    }

    if (notFound.length > 0) {
      return new Err(`Icon(s) not found: ${notFound.join(", ")}`);
    }

    // 5. Run preRemove hooks
    const preRemoveResult = await runHooks(
      config.hooks?.preRemove,
      options.cwd
    );
    if (preRemoveResult.isErr()) {
      return preRemoveResult;
    }

    // 6. Check if removing all icons - reset to template
    const remainingCount = existingIcons.length - icons.length;
    if (remainingCount === 0) {
      const writeResult = await writeFile(iconsPath, getIconsTemplate(config));
      if (writeResult.isErr()) {
        return new Err(`Failed to write icons file: ${config.output}`);
      }
      for (const icon of icons) {
        logger.success(`Removed ${icon}`);
      }
      const postRemoveResult = await runHooks(
        config.hooks?.postRemove,
        options.cwd
      );
      if (postRemoveResult.isErr()) {
        return postRemoveResult;
      }
      return new Ok(null);
    }

    // 7. Remove icons one by one
    for (const icon of icons) {
      iconsContent = removeIcon(iconsContent, icon);
      logger.success(`Removed ${icon}`);
    }

    // 8. Write updated file
    const writeResult = await writeFile(iconsPath, iconsContent);
    if (writeResult.isErr()) {
      return new Err(`Failed to write icons file: ${config.output}`);
    }

    // 9. Run postRemove hooks
    const postRemoveResult = await runHooks(
      config.hooks?.postRemove,
      options.cwd
    );
    if (postRemoveResult.isErr()) {
      return postRemoveResult;
    }

    return new Ok(null);
  }
}
