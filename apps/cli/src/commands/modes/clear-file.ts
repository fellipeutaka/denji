import path from "node:path";
import { cancel } from "@clack/prompts";
import type { FrameworkOptions } from "~/frameworks/types";
import type { Config } from "~/schemas/config";
import type { ClearDeps } from "~/services/deps";
import { CANCEL_MESSAGE } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

import type { ClearOptions } from "../clear";

type Deps = Pick<ClearDeps, "fs" | "hooks" | "icons" | "prompts" | "logger">;

export async function clearFileMode(
  options: ClearOptions,
  cfg: Config,
  strategy: Awaited<ReturnType<ClearDeps["frameworks"]["createStrategy"]>>,
  deps: Deps
) {
  const { fs, hooks, icons, prompts, logger } = deps;

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

  const iconsContent = iconsFileResult.value;
  const existingIcons = icons.getExistingIconNames(iconsContent);

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

  const postClearResult = await hooks.runHooks(
    cfg.hooks?.postClear,
    options.cwd
  );
  if (postClearResult.isErr()) {
    return postClearResult;
  }

  return new Ok(null);
}
