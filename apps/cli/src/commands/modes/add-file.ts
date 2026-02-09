import path from "node:path";
import type { FrameworkOptions } from "~/frameworks/types";
import type { A11y, Config } from "~/schemas/config";
import type { AddDeps } from "~/services/deps";
import { Err, Ok } from "~/utils/result";

import type { AddOptions } from "../add";

type Deps = Pick<AddDeps, "fs" | "hooks" | "icons" | "prompts" | "logger">;

export async function addFileMode(
  icons: string[],
  options: AddOptions,
  cfg: Config,
  strategy: Awaited<ReturnType<AddDeps["frameworks"]["createStrategy"]>>,
  frameworkOptions: FrameworkOptions,
  a11yOverride: A11y | undefined,
  deps: Deps
) {
  const { fs, hooks, icons: iconUtils, prompts, logger } = deps;

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
  let addedCount = 0;

  const useForwardRef = strategy.isForwardRefEnabled(frameworkOptions);

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

    if (useForwardRef && existingIcons.length === 0 && addedCount === 0) {
      const importSource = strategy.getForwardRefImportSource();
      if (
        !iconsContent.includes(`import { forwardRef } from "${importSource}"`)
      ) {
        iconsContent = `import { forwardRef } from "${importSource}";\n\n${iconsContent}`;
      }
    }

    if (existingIcons.includes(componentName)) {
      iconsContent = iconUtils.replaceIcon(
        iconsContent,
        componentName,
        component
      );
      logger.success(`Replaced ${componentName}`);
    } else {
      iconsContent = iconUtils.insertIconAlphabetically(
        iconsContent,
        componentName,
        component
      );
      existingIcons.push(componentName);
      logger.success(`Added ${componentName}`);
    }

    addedCount++;
  }

  if (addedCount > 0) {
    const writeResult = await fs.writeFile(iconsPath, iconsContent);
    if (writeResult.isErr()) {
      return new Err(`Failed to write icons file: ${cfg.output.path}`);
    }

    const postAddResult = await hooks.runHooks(
      cfg.hooks?.postAdd ?? [],
      options.cwd
    );
    if (postAddResult.isErr()) {
      return postAddResult;
    }
  }

  return new Ok(null);
}
