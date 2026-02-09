import path from "node:path";
import type { FrameworkOptions } from "~/frameworks/types";
import type { Config } from "~/schemas/config";
import type { RemoveDeps } from "~/services/deps";
import { Err, Ok } from "~/utils/result";

import type { RemoveOptions } from "../remove";

type Deps = Pick<RemoveDeps, "fs" | "hooks" | "icons" | "logger">;

export async function removeFileMode(
  icons: string[],
  options: RemoveOptions,
  cfg: Config,
  strategy: Awaited<ReturnType<RemoveDeps["frameworks"]["createStrategy"]>>,
  deps: Deps
) {
  const { fs, hooks, icons: iconUtils, logger } = deps;

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

  let iconsContent = iconsFileResult.value;
  const existingIcons = iconUtils.getExistingIconNames(iconsContent);

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
    cfg.hooks?.preRemove ?? [],
    options.cwd
  );
  if (preRemoveResult.isErr()) {
    return preRemoveResult;
  }

  const remainingCount = existingIcons.length - icons.length;
  if (remainingCount === 0) {
    const frameworkOptions =
      (cfg[strategy.getConfigKey() as keyof Config] as FrameworkOptions) ?? {};
    const template = strategy.getIconsTemplate({
      typescript: cfg.typescript,
      frameworkOptions,
    });
    const writeResult = await fs.writeFile(iconsPath, template);
    if (writeResult.isErr()) {
      return new Err(`Failed to write icons file: ${cfg.output.path}`);
    }
    for (const icon of icons) {
      logger.success(`Removed ${icon}`);
    }
    const postRemoveResult = await hooks.runHooks(
      cfg.hooks?.postRemove ?? [],
      options.cwd
    );
    if (postRemoveResult.isErr()) {
      return postRemoveResult;
    }
    return new Ok(null);
  }

  for (const icon of icons) {
    iconsContent = iconUtils.removeIcon(iconsContent, icon);
    logger.success(`Removed ${icon}`);
  }

  const writeResult = await fs.writeFile(iconsPath, iconsContent);
  if (writeResult.isErr()) {
    return new Err(`Failed to write icons file: ${cfg.output.path}`);
  }

  const postRemoveResult = await hooks.runHooks(
    cfg.hooks?.postRemove ?? [],
    options.cwd
  );
  if (postRemoveResult.isErr()) {
    return postRemoveResult;
  }

  return new Ok(null);
}
