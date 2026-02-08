import path from "node:path";
import type { FrameworkOptions } from "~/frameworks/types";
import type { A11y, Config } from "~/schemas/config";
import type { AddDeps } from "~/services/deps";
import {
  generateBarrel,
  getExistingIconNames as getFolderIconNames,
} from "~/utils/icons-folder";
import { Err, Ok } from "~/utils/result";

import type { AddOptions } from "../add";

type Deps = Pick<AddDeps, "fs" | "hooks" | "icons" | "prompts" | "logger">;

export async function addFolderMode(
  icons: string[],
  options: AddOptions,
  cfg: Config,
  strategy: Awaited<ReturnType<AddDeps["frameworks"]["createStrategy"]>>,
  frameworkOptions: FrameworkOptions,
  a11yOverride: A11y | undefined,
  deps: Deps
) {
  const { fs, hooks, icons: iconUtils, prompts, logger } = deps;

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
  let addedCount = 0;

  for (const icon of icons) {
    const componentName = options.name ?? iconUtils.toComponentName(icon);

    if (existingIcons.includes(componentName)) {
      const overwrite = await prompts.confirm({
        message: `Icon "${componentName}" already exists. Overwrite?`,
        initialValue: false,
      });

      if (!overwrite) {
        logger.info(`Skipped ${componentName}`);
        continue;
      }
    }

    const svgResult = await iconUtils.fetchIcon(icon);
    if (svgResult.isErr()) {
      logger.error(`Failed to fetch ${icon}: ${svgResult.error}`);
      continue;
    }

    const component = await strategy.transformSvg(
      svgResult.value,
      {
        a11y: a11yOverride ?? cfg.a11y,
        trackSource: cfg.trackSource ?? true,
        iconName: icon,
        componentName,
      },
      { ...frameworkOptions, typescript: cfg.typescript }
    );

    const isReplacing = existingIcons.includes(componentName);
    const componentPath = path.join(outputDir, `${componentName}${ext}`);
    const writeResult = await fs.writeFile(componentPath, component);
    if (writeResult.isErr()) {
      logger.error(`Failed to write ${componentName}${ext}`);
      continue;
    }

    if (!isReplacing) {
      existingIcons.push(componentName);
    }

    logger.success(
      isReplacing ? `Replaced ${componentName}` : `Added ${componentName}`
    );
    addedCount++;
  }

  if (addedCount > 0) {
    // Regenerate barrel
    const barrelExt = cfg.typescript ? ".ts" : ".js";
    const barrelPath = path.join(outputDir, `index${barrelExt}`);
    const barrelContent = generateBarrel(existingIcons, ext, cfg.typescript);
    const writeBarrelResult = await fs.writeFile(barrelPath, barrelContent);
    if (writeBarrelResult.isErr()) {
      return new Err("Failed to write barrel file");
    }

    const postAddResult = await hooks.runHooks(cfg.hooks?.postAdd, options.cwd);
    if (postAddResult.isErr()) {
      return postAddResult;
    }
  }

  return new Ok(null);
}
