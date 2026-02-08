import path from "node:path";
import { cancel } from "@clack/prompts";
import type { Config } from "~/schemas/config";
import type { ClearDeps } from "~/services/deps";
import {
  generateBarrel,
  getExistingIconNames as getFolderIconNames,
} from "~/utils/icons-folder";
import { CANCEL_MESSAGE } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

import type { ClearOptions } from "../clear";

type Deps = Pick<ClearDeps, "fs" | "hooks" | "prompts" | "logger">;

export async function clearFolderMode(
  options: ClearOptions,
  cfg: Config,
  strategy: Awaited<ReturnType<ClearDeps["frameworks"]["createStrategy"]>>,
  deps: Deps
) {
  const { fs, hooks, prompts, logger } = deps;

  const outputDir = path.resolve(options.cwd, cfg.output.path);
  if (!(await fs.access(outputDir))) {
    return new Err(
      `Icons directory not found: ${cfg.output.path}. Run "denji init" first.`
    );
  }

  const ext = strategy.fileExtensions.typescript;
  const readdirResult = await fs.readdir(outputDir);
  if (readdirResult.isErr()) {
    return new Err(`Failed to read directory: ${cfg.output.path}`);
  }

  const existingIcons = getFolderIconNames(readdirResult.value, ext);

  if (existingIcons.length === 0) {
    logger.info("No icons to remove");
    return new Ok(null);
  }

  if (!options.yes) {
    const shouldContinue = await prompts.confirm({
      message: `Remove all ${existingIcons.length} icon(s)?`,
      initialValue: false,
    });

    if (!shouldContinue) {
      cancel(CANCEL_MESSAGE);
    }
  }

  const preClearResult = await hooks.runHooks(cfg.hooks?.preClear, options.cwd);
  if (preClearResult.isErr()) {
    return preClearResult;
  }

  // Delete all icon component files
  for (const icon of existingIcons) {
    const iconPath = path.join(outputDir, `${icon}${ext}`);
    await fs.unlink(iconPath);
  }

  // Rewrite barrel to empty
  const barrelExt = cfg.typescript ? ".ts" : ".js";
  const barrelPath = path.join(outputDir, `index${barrelExt}`);
  const barrelContent = generateBarrel([], ext, cfg.typescript);
  const writeResult = await fs.writeFile(barrelPath, barrelContent);
  if (writeResult.isErr()) {
    return new Err("Failed to write barrel file");
  }

  const postClearResult = await hooks.runHooks(
    cfg.hooks?.postClear,
    options.cwd
  );
  if (postClearResult.isErr()) {
    return postClearResult;
  }

  return new Ok(null);
}
