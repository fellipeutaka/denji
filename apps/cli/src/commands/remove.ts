import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { removeDefaults } from "~/services/defaults";
import type { RemoveDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err } from "~/utils/result";

export interface RemoveOptions {
  cwd: string;
}

export class RemoveCommand {
  constructor(private readonly deps: RemoveDeps) {}

  async run(icons: string[], options: RemoveOptions) {
    const { fs, config, frameworks } = this.deps;

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

    const runMode =
      cfg.output.type === "folder"
        ? this.deps.runFolderMode
        : this.deps.runFileMode;

    return runMode(icons, options, cfg, strategy, this.deps);
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
