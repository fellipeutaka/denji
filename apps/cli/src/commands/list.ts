import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { listDefaults } from "~/services/defaults";
import type { ListDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { resolveContext } from "~/utils/resolve-context";

export interface ListOptions {
  cwd: string;
  json?: boolean;
}

export class ListCommand {
  constructor(private readonly deps: ListDeps) {}

  async run(options: ListOptions) {
    const ctxResult = await resolveContext(this.deps, options.cwd);
    if (ctxResult.isErr()) {
      return ctxResult;
    }
    const { cfg, strategy } = ctxResult.value;

    if (cfg.output.type === "folder") {
      return this.deps.runFolderMode(options, cfg, strategy, this.deps);
    }

    return this.deps.runFileMode(options, cfg, this.deps);
  }
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

    const command = new ListCommand(listDefaults);

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    if (!options.json) {
      outro("Done");
    }
  });
