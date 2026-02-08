import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { clearDefaults } from "~/services/defaults";
import type { ClearDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err } from "~/utils/result";

export interface ClearOptions {
  cwd: string;
  yes: boolean;
}

export class ClearCommand {
  constructor(private readonly deps: ClearDeps) {}

  async run(options: ClearOptions) {
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

    return runMode(options, cfg, strategy, this.deps);
  }
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

    const command = new ClearCommand(clearDefaults);

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro("All icons removed");
  });
