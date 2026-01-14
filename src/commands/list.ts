import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { loadConfig } from "~/utils/config";
import { access, readFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { parseIconsFile } from "~/utils/icons";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";

interface ListOptions {
  cwd: string;
}

export const list = new Command()
  .name("list")
  .description("List all icons in your project")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: ListOptions) => {
    intro("denji list");

    const result = await runList(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro("Done");
  });

async function runList(options: ListOptions) {
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

  // 3. Check if icons file exists
  const iconsPath = path.resolve(options.cwd, config.output);
  if (!(await access(iconsPath))) {
    return new Err(
      `Icons file not found: ${config.output}. Run "denji init" first.`
    );
  }

  // 4. Read icons file
  const iconsFileResult = await readFile(iconsPath, "utf-8");
  if (iconsFileResult.isErr()) {
    return new Err(`Failed to read icons file: ${config.output}`);
  }

  // 5. Parse icons
  const iconsContent = iconsFileResult.value;
  const { icons } = parseIconsFile(iconsContent);

  // 6. Display results
  if (icons.length === 0) {
    logger.info(`No icons found in ${config.output}`);
    return new Ok(null);
  }

  logger.success(`Found ${icons.length} icon(s) in ${config.output}`);
  logger.break();
  logger.info("Icons:");
  for (const icon of icons) {
    logger.info(`  • ${icon.name}`);
  }

  return new Ok(null);
}
