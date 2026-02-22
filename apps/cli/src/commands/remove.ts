import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { removeDefaults } from "~/services/defaults";
import type { RemoveDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { resolveContext } from "~/utils/resolve-context";

export interface RemoveOptions {
  cwd: string;
}

export class RemoveCommand {
  constructor(private readonly deps: RemoveDeps) {}

  async run(icons: string[], options: RemoveOptions) {
    const ctxResult = await resolveContext(this.deps, options.cwd);
    if (ctxResult.isErr()) {
      return ctxResult;
    }
    const { cfg, strategy } = ctxResult.value;

    const runMode =
      cfg.output.type === "folder"
        ? this.deps.runFolderMode
        : this.deps.runFileMode;

    return runMode(icons, options, cfg, strategy, this.deps);
  }
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

    const command = new RemoveCommand(removeDefaults);

    const result = await command.run(icons, options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro(`Removed ${icons.length} icon(s)`);
  });
