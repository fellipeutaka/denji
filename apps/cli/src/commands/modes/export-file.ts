import path from "node:path";
import type { Config } from "~/schemas/config";
import type { ExportDeps, ExportManifest } from "~/services/deps";
import { Err, Ok } from "~/utils/result";

type Deps = Pick<ExportDeps, "fs" | "icons" | "logger">;

export async function exportFileMode(
  options: { cwd: string; output?: string | boolean },
  cfg: Config,
  deps: Deps
) {
  const { fs, icons } = deps;

  const iconsPath = path.resolve(options.cwd, cfg.output.path);
  if (!(await fs.access(iconsPath))) {
    return new Err(
      `Icons file not found: ${cfg.output.path}. Run "denji init" first.`
    );
  }

  const iconsFileResult = await fs.readFile(iconsPath, "utf-8");
  if (iconsFileResult.isErr()) {
    return new Err(`Failed to read icons file: ${cfg.output.path}`);
  }

  const { icons: parsedIcons } = icons.parseIconsFile(iconsFileResult.value);

  const manifest: ExportManifest = {
    version: 1,
    framework: cfg.framework,
    output: cfg.output.path,
    icons: parsedIcons.map(({ name, source }) => {
      if (source) {
        return { name, source };
      }
      return { name };
    }),
  };

  return writeManifest(manifest, options, deps);
}

export async function writeManifest(
  manifest: ExportManifest,
  options: { cwd: string; output?: string | boolean },
  deps: Pick<Deps, "fs" | "logger">
) {
  const { fs } = deps;
  const json = JSON.stringify(manifest, null, 2);

  if (!options.output) {
    console.log(json);
    return new Ok(null);
  }

  const outputPath =
    typeof options.output === "string"
      ? path.resolve(options.cwd, options.output)
      : path.resolve(options.cwd, "denji-export.json");

  const writeResult = await fs.writeFile(outputPath, json);
  if (writeResult.isErr()) {
    return new Err(`Failed to write export file: ${writeResult.error}`);
  }

  return new Ok(null);
}
