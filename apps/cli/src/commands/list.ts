import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { listDefaults } from "~/services/defaults";
import type { ListDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err, Ok } from "~/utils/result";

export interface ListOptions {
  cwd: string;
  json?: boolean;
}

export class ListCommand {
  constructor(private readonly deps: ListDeps) {}

  async run(options: ListOptions) {
    const { fs, config, hooks, icons, logger } = this.deps;

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

    // 3. Check if icons file exists
    const iconsPath = path.resolve(options.cwd, cfg.output);
    if (!(await fs.access(iconsPath))) {
      return new Err(
        `Icons file not found: ${cfg.output}. Run "denji init" first.`
      );
    }

    // 4. Read icons file
    const iconsFileResult = await fs.readFile(iconsPath, "utf-8");
    if (iconsFileResult.isErr()) {
      return new Err(`Failed to read icons file: ${cfg.output}`);
    }

    // 5. Run preList hooks
    const preListResult = await hooks.runHooks(cfg.hooks?.preList, options.cwd);
    if (preListResult.isErr()) {
      return preListResult;
    }

    // 6. Parse icons
    const iconsContent = iconsFileResult.value;
    const { icons: parsedIcons } = icons.parseIconsFile(iconsContent);

    // 7. Display results
    if (options.json) {
      const output = {
        count: parsedIcons.length,
        output: cfg.output,
        icons: parsedIcons.map((icon) => icon.name),
      };
      console.info(JSON.stringify(output, null, 2));
      const postListResult = await hooks.runHooks(
        cfg.hooks?.postList,
        options.cwd
      );
      if (postListResult.isErr()) {
        return postListResult;
      }
      return new Ok(null);
    }

    if (parsedIcons.length === 0) {
      logger.info(`No icons found in ${cfg.output}`);
      const postListResult = await hooks.runHooks(
        cfg.hooks?.postList,
        options.cwd
      );
      if (postListResult.isErr()) {
        return postListResult;
      }
      return new Ok(null);
    }

    logger.success(`Found ${parsedIcons.length} icon(s) in ${cfg.output}`);
    logger.break();
    logger.info("Icons:");
    for (const icon of parsedIcons) {
      logger.info(`  • ${icon.name}`);
    }

    // 8. Run postList hooks
    const postListResult = await hooks.runHooks(
      cfg.hooks?.postList,
      options.cwd
    );
    if (postListResult.isErr()) {
      return postListResult;
    }

    return new Ok(null);
  }
}

export function createListCommand(): ListCommand {
  return new ListCommand(listDefaults);
}

export const list = new Command()
  .name("list")
  .description("List all icons in your project")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .option("--json", "Output icons as JSON")
  .action(async (options: ListOptions) => {
    if (!options.json) {
      intro("denji list");
    }

    const command = createListCommand();

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    if (!options.json) {
      outro("Done");
    }
  });
