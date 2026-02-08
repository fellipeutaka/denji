import path from "node:path";
import type { Config } from "~/schemas/config";
import type { ListDeps } from "~/services/deps";
import { Err, Ok } from "~/utils/result";

import type { ListOptions } from "../list";

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

  const preListResult = await hooks.runHooks(cfg.hooks?.preList, options.cwd);
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
  const trackSource = cfg.trackSource ?? true;

  if (options.json) {
    const output = {
      count: parsedIcons.length,
      output: cfg.output.path,
      icons: trackSource
        ? parsedIcons.map((icon) => ({
            name: icon.name,
            source: icon.source ?? null,
          }))
        : parsedIcons.map((icon) => icon.name),
    };
    console.info(JSON.stringify(output, null, 2));
    const postListResult = await hooks.runHooks(
      cfg.hooks?.postList,
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
      cfg.hooks?.postList,
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
  for (const icon of parsedIcons) {
    if (trackSource) {
      const sourceInfo = icon.source ? `(${icon.source})` : "(⚠️  Unknown)";
      logger.info(`  • ${icon.name} ${sourceInfo}`);
    } else {
      logger.info(`  • ${icon.name}`);
    }
  }

  const postListResult = await hooks.runHooks(cfg.hooks?.postList, options.cwd);
  if (postListResult.isErr()) {
    return postListResult;
  }

  return new Ok(null);
}
