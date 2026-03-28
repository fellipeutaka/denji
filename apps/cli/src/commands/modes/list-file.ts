import path from "node:path";
import type { Config } from "~/schemas/config";
import type { ListDeps } from "~/services/deps";
import { Err, Ok } from "~/utils/result";

import type { ListOptions } from "../list";
import { createDisplayStrategy } from "./display-strategies";

type Deps = Pick<ListDeps, "fs" | "hooks" | "icons" | "logger">;

export async function listFileMode(
  options: ListOptions,
  cfg: Config,
  deps: Deps
) {
  const { fs, hooks, icons } = deps;

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

  const preListResult = await hooks.runHooks(
    cfg.hooks?.preList ?? [],
    options.cwd
  );
  if (preListResult.isErr()) {
    return preListResult;
  }

  const iconsContent = iconsFileResult.value;
  const { icons: parsedIcons } = icons.parseIconsFile(iconsContent);

  return displayResults(options, cfg, parsedIcons, deps);
}

export async function displayResults(
  options: ListOptions,
  cfg: Config,
  parsedIcons: Array<{ name: string; source?: string }>,
  deps: Pick<Deps, "hooks" | "logger">
) {
  const { hooks, logger } = deps;
  const display = options.display ?? "default";
  const strategy = await createDisplayStrategy(display);

  if (display !== "default") {
    strategy.render({ cfg, icons: parsedIcons, log: console.info });
    const postListResult = await hooks.runHooks(
      cfg.hooks?.postList ?? [],
      options.cwd
    );
    if (postListResult.isErr()) {
      return postListResult;
    }
    return new Ok(null);
  }

  if (parsedIcons.length === 0) {
    logger.info(`No icons found in ${cfg.output.path}`);
    const postListResult = await hooks.runHooks(
      cfg.hooks?.postList ?? [],
      options.cwd
    );
    if (postListResult.isErr()) {
      return postListResult;
    }
    return new Ok(null);
  }

  logger.success(`Found ${parsedIcons.length} icon(s) in ${cfg.output.path}`);
  logger.break();
  logger.info("Icons:");
  strategy.render({ cfg, icons: parsedIcons, log: logger.info });

  const postListResult = await hooks.runHooks(
    cfg.hooks?.postList ?? [],
    options.cwd
  );
  if (postListResult.isErr()) {
    return postListResult;
  }

  return new Ok(null);
}
