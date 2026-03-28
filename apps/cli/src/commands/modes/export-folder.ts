import path from "node:path";
import type { Config } from "~/schemas/config";
import type { ExportDeps, ExportManifest } from "~/services/deps";
import { getExistingIconNames as getFolderIconNames } from "~/utils/icons-folder";
import { Err } from "~/utils/result";
import { writeManifest } from "./export-file";

type Deps = Pick<ExportDeps, "fs" | "logger">;

export async function exportFolderMode(
  options: { cwd: string; output?: string | boolean },
  cfg: Config,
  strategy: Awaited<ReturnType<ExportDeps["frameworks"]["createStrategy"]>>,
  deps: Deps
) {
  const { fs } = deps;

  const outputDir = path.resolve(options.cwd, cfg.output.path);
  if (!(await fs.access(outputDir))) {
    return new Err(
      `Icons directory not found: ${cfg.output.path}. Run "denji init" first.`
    );
  }

  const readdirResult = await fs.readdir(outputDir);
  if (readdirResult.isErr()) {
    return new Err(`Failed to read directory: ${cfg.output.path}`);
  }

  const ext = strategy.fileExtensions.typescript;
  const iconNames = getFolderIconNames(readdirResult.value, ext);

  const manifest: ExportManifest = {
    version: 1,
    framework: cfg.framework,
    output: cfg.output.path,
    icons: iconNames.map((name) => ({ name })),
  };

  return writeManifest(manifest, options, deps);
}
