import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { importDefaults } from "~/services/defaults";
import type { AddDeps, ExportManifest, ImportDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err, Ok } from "~/utils/result";
import { AddCommand } from "./add";

export interface ImportOptions {
  cwd: string;
  dryRun?: boolean;
  file?: string;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export class ImportCommand {
  constructor(private readonly deps: ImportDeps) {}

  async run(options: ImportOptions) {
    const { logger } = this.deps;

    // 1. Read raw input
    let rawContent: string;

    if (options.file) {
      const filePath = path.resolve(options.cwd, options.file);
      const readResult = await this.deps.fs.readFile(filePath, "utf-8");
      if (readResult.isErr()) {
        return new Err(`Failed to read file: ${options.file}`);
      }
      rawContent = readResult.value;
    } else if (process.stdin.isTTY) {
      return new Err(
        'No input provided. Pass a file path or pipe icons via stdin.\n\nExamples:\n  denji import icons.json\n  echo "mdi:home" | denji import'
      );
    } else {
      rawContent = await readStdin();
    }

    // 2. Parse icons from input
    let icons: string[];

    if (options.file?.endsWith(".json")) {
      let manifest: ExportManifest;
      try {
        manifest = JSON.parse(rawContent) as ExportManifest;
      } catch {
        return new Err(`Failed to parse JSON file: ${options.file}`);
      }

      const withSource = manifest.icons.filter((i) => i.source);
      const skipped = manifest.icons.length - withSource.length;
      if (skipped > 0) {
        logger.warn(`Skipped ${skipped} icon(s) with no source tracking info.`);
      }

      icons = withSource.map((i) => i.source as string);
    } else {
      icons = rawContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    // 3. Filter invalid icon names
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const icon of icons) {
      if (icon.includes(":")) {
        valid.push(icon);
      } else {
        invalid.push(icon);
      }
    }

    if (invalid.length > 0) {
      logger.warn(
        `Skipped ${invalid.length} invalid icon(s) (missing prefix): ${invalid.join(", ")}`
      );
    }

    if (valid.length === 0) {
      return new Err("No valid icons to import.");
    }

    // 4. Delegate to AddCommand
    const addDeps: AddDeps = {
      config: this.deps.config,
      frameworks: this.deps.frameworks,
      fs: this.deps.fs,
      hooks: this.deps.hooks,
      icons: this.deps.icons,
      prompts: this.deps.prompts,
      logger: this.deps.logger,
      runFileMode: this.deps.runAddFileMode,
      runFolderMode: this.deps.runAddFolderMode,
    };

    const addCommand = new AddCommand(addDeps);
    const result = await addCommand.run(valid, {
      cwd: options.cwd,
      dryRun: options.dryRun,
    });
    if (result.isErr()) {
      return result;
    }

    return new Ok({ count: valid.length });
  }
}

export const importCmd = new Command()
  .name("import")
  .description("Bulk-add icons from a manifest JSON, text file, or stdin")
  .argument("[file]", "Path to a .json manifest or .txt file with icon names")
  .option("--dry-run", "Preview what would be added without writing files")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(
    async (file: string | undefined, options: Omit<ImportOptions, "file">) => {
      intro("denji import");

      const command = new ImportCommand(importDefaults);

      const result = await command.run({ ...options, file });
      if (result.isErr()) {
        handleError(result.error);
      }

      if (result.isOk()) {
        outro(
          options.dryRun
            ? `Dry run complete — ${result.value.count} icon(s) previewed, no files written`
            : `Imported ${result.value.count} icon(s)`
        );
      }
    }
  );
