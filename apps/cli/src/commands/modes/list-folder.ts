import path from "node:path";
import type { Config } from "~/schemas/config";
import type { ListDeps } from "~/services/deps";
import { getExistingIconNames as getFolderIconNames } from "~/utils/icons-folder";
import { Err } from "~/utils/result";

import type { ListOptions } from "../list";
import { displayResults } from "./list-file";

type Deps = Pick<ListDeps, "fs" | "hooks" | "logger">;

export async function listFolderMode(
  options: ListOptions,
  cfg: Config,
  strategy: Awaited<ReturnType<ListDeps["frameworks"]["createStrategy"]>>,
  deps: Deps
) {
  const { fs, hooks } = deps;

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

  const preListResult = await hooks.runHooks(cfg.hooks?.preList, options.cwd);
  if (preListResult.isErr()) {
    return preListResult;
  }

  return displayResults(
    options,
    cfg,
    iconNames.map((name) => ({ name })),
    deps
  );
}
