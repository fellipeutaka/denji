import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { createFrameworkStrategy } from "~/frameworks/factory";
import { type A11y, a11ySchema, type Config } from "~/schemas/config";
import { loadConfig } from "~/utils/config";
import { access, readFile, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { runHooks } from "~/utils/hooks";
import {
  fetchIcon,
  getExistingIconNames,
  insertIconAlphabetically,
  replaceIcon,
  svgToComponent,
  toComponentName,
  validateIconName,
} from "~/utils/icons";
import { logger } from "~/utils/logger";
import { enhancedConfirm } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

export interface AddOptions {
  cwd: string;
  name?: string;
  a11y?: string | boolean;
}

export const add = new Command()
  .name("add")
  .description("Add icons to your project")
  .argument("<icons...>", "Icon names (e.g., mdi:home lucide:check)")
  .option("--name <name>", "Custom component name (single icon only)")
  .option("--a11y <strategy>", "Accessibility strategy (overrides config)")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (icons: string[], options: AddOptions) => {
    intro("denji add");

    const command = new AddCommand();

    const result = await command.run(icons, options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro(`Added ${icons.length} icon(s)`);
  });

export class AddCommand {
  async run(icons: string[], options: AddOptions) {
    // 1. Validate cwd exists
    if (!(await access(options.cwd))) {
      return new Err(`Directory does not exist: ${options.cwd}`);
    }

    // 2. Validate --name with multiple icons
    if (options.name && icons.length > 1) {
      return new Err("--name can only be used with a single icon");
    }

    // 3. Validate all icon names
    for (const icon of icons) {
      const validation = validateIconName(icon);
      if (validation.isErr()) {
        return validation;
      }
    }

    // 4. Validate --a11y if provided
    let a11yOverride: A11y | undefined;
    if (options.a11y !== undefined) {
      const a11yInput = options.a11y === "false" ? false : options.a11y;
      const a11yResult = a11ySchema.safeParse(a11yInput);
      if (!a11yResult.success) {
        return new Err(
          `Invalid a11y strategy: ${options.a11y}. Use: hidden, img, title, presentation, false`
        );
      }
      a11yOverride = a11yResult.data;
    }

    // 5. Load config
    const configResult = await loadConfig(options.cwd);
    if (configResult.isErr()) {
      return configResult;
    }
    const config = configResult.value;

    // 6. Load framework strategy
    const strategy = await createFrameworkStrategy(config.framework);

    // 7. Run preAdd hooks
    const preAddResult = await runHooks(config.hooks?.preAdd, options.cwd);
    if (preAddResult.isErr()) {
      return preAddResult;
    }

    // 8. Read icons file
    const iconsPath = path.resolve(options.cwd, config.output);
    if (!(await access(iconsPath))) {
      return new Err(
        `Icons file not found: ${config.output}. Run "denji init" first.`
      );
    }

    const iconsFileResult = await readFile(iconsPath, "utf-8");
    if (iconsFileResult.isErr()) {
      return new Err(`Failed to read icons file: ${config.output}`);
    }

    let iconsContent = iconsFileResult.value;
    const existingIcons = getExistingIconNames(iconsContent);
    let addedCount = 0;

    // Check if forwardRef is enabled using strategy
    const frameworkOptions = config[strategy.getConfigKey() as keyof Config];
    const useForwardRef = strategy.isForwardRefEnabled(
      (frameworkOptions as Record<string, unknown>) ?? {}
    );

    // 9. Process each icon
    for (const icon of icons) {
      const componentName = options.name ?? toComponentName(icon);

      // Check if exists
      if (existingIcons.includes(componentName)) {
        const overwrite = await enhancedConfirm({
          message: `Icon "${componentName}" already exists. Overwrite?`,
          initialValue: false,
        });

        if (!overwrite) {
          logger.info(`Skipped ${componentName}`);
          continue;
        }
      }

      // Fetch icon
      const svgResult = await fetchIcon(icon);
      if (svgResult.isErr()) {
        logger.error(`Failed to fetch ${icon}: ${svgResult.error}`);
        continue;
      }

      // Convert to component
      const component = await svgToComponent(svgResult.value, componentName, {
        a11y: a11yOverride ?? config.a11y,
        trackSource: config.trackSource ?? true,
        iconName: icon,
        forwardRef: useForwardRef,
      });

      // Add forwardRef import if needed (first icon with empty Icons object)
      if (useForwardRef && existingIcons.length === 0 && addedCount === 0) {
        const importSource = strategy.getForwardRefImportSource();
        if (
          !iconsContent.includes(`import { forwardRef } from "${importSource}"`)
        ) {
          iconsContent = `import { forwardRef } from "${importSource}";\n\n${iconsContent}`;
        }
      }

      // Insert or replace
      if (existingIcons.includes(componentName)) {
        iconsContent = replaceIcon(iconsContent, componentName, component);
        logger.success(`Replaced ${componentName}`);
      } else {
        iconsContent = insertIconAlphabetically(
          iconsContent,
          componentName,
          component
        );
        existingIcons.push(componentName);
        logger.success(`Added ${componentName}`);
      }

      addedCount++;
    }

    // 10. Write updated file and run postAdd hooks
    if (addedCount > 0) {
      const writeResult = await writeFile(iconsPath, iconsContent);
      if (writeResult.isErr()) {
        return new Err(`Failed to write icons file: ${config.output}`);
      }

      const postAddResult = await runHooks(config.hooks?.postAdd, options.cwd);
      if (postAddResult.isErr()) {
        return postAddResult;
      }
    }

    return new Ok(null);
  }
}
