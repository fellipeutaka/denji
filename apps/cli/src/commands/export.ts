import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { exportDefaults } from "~/services/defaults";
import type { ExportDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { resolveContext } from "~/utils/resolve-context";

export interface ExportOptions {
  cwd: string;
  output?: string | boolean;
}

export class ExportCommand {
  constructor(private readonly deps: ExportDeps) {}

  async run(options: ExportOptions) {
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

export const exportCmd = new Command()
  .name("export")
  .description("Export a JSON manifest of all tracked icons")
  .option(
    "--output [path]",
    'Write to a file (defaults to "denji-export.json" if no path given)'
  )
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: ExportOptions) => {
    if (options.output) {
      intro("denji export");
    }

    const command = new ExportCommand(exportDefaults);

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    if (options.output) {
      const outputPath =
        typeof options.output === "string"
          ? options.output
          : "denji-export.json";
      outro(`Exported to ${outputPath}`);
    }
  });
