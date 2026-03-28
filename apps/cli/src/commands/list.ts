import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { listDefaults } from "~/services/defaults";
import type { ListDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { resolveContext } from "~/utils/resolve-context";
import type { DisplayMode } from "./modes/display-strategies";

export interface ListOptions {
  cwd: string;
  display?: DisplayMode;
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
  .option(
    "--display <mode>",
    'Output display mode: "default", "json", or "toon"',
    "default"
  )
  .action(async (options: ListOptions) => {
    if (options.display === "default" || options.display == null) {
      intro("denji list");
    }

    const command = new ListCommand(listDefaults);

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    if (options.display === "default" || options.display == null) {
      outro("Done");
    }
  });
