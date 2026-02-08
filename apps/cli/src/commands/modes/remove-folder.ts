import path from "node:path";
import type { Config } from "~/schemas/config";
import type { RemoveDeps } from "~/services/deps";
import {
  generateBarrel,
  getExistingIconNames as getFolderIconNames,
} from "~/utils/icons-folder";
import { Err, Ok } from "~/utils/result";

import type { RemoveOptions } from "../remove";

type Deps = Pick<RemoveDeps, "fs" | "hooks" | "logger">;

export async function removeFolderMode(
  icons: string[],
  options: RemoveOptions,
  cfg: Config,
  strategy: Awaited<ReturnType<RemoveDeps["frameworks"]["createStrategy"]>>,
  deps: Deps
) {
  const { fs, hooks, logger } = deps;

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

  const notFound: string[] = [];
  for (const icon of icons) {
    if (!existingIcons.includes(icon)) {
      notFound.push(icon);
    }
  }

  if (notFound.length > 0) {
    return new Err(`Icon(s) not found: ${notFound.join(", ")}`);
  }

  const preRemoveResult = await hooks.runHooks(
    cfg.hooks?.preRemove,
    options.cwd
  );
  if (preRemoveResult.isErr()) {
    return preRemoveResult;
  }

  for (const icon of icons) {
    const iconPath = path.join(outputDir, `${icon}${ext}`);
    const unlinkResult = await fs.unlink(iconPath);
    if (unlinkResult.isErr()) {
      logger.error(`Failed to remove ${icon}${ext}`);
      continue;
    }
    logger.success(`Removed ${icon}`);
  }

  // Regenerate barrel
  const remaining = existingIcons.filter((name) => !icons.includes(name));
  const barrelExt = cfg.typescript ? ".ts" : ".js";
  const barrelPath = path.join(outputDir, `index${barrelExt}`);
  const barrelContent = generateBarrel(remaining, ext, cfg.typescript);
  const writeBarrelResult = await fs.writeFile(barrelPath, barrelContent);
  if (writeBarrelResult.isErr()) {
    return new Err("Failed to write barrel file");
  }

  const postRemoveResult = await hooks.runHooks(
    cfg.hooks?.postRemove,
    options.cwd
  );
  if (postRemoveResult.isErr()) {
    return postRemoveResult;
  }

  return new Ok(null);
}
