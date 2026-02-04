import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import type { FrameworkOptions } from "~/frameworks/types";
import { type A11y, a11ySchema, type Config } from "~/schemas/config";
import { addDefaults } from "~/services/defaults";
import type { AddDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err, Ok } from "~/utils/result";

export interface AddOptions {
  cwd: string;
  name?: string;
  a11y?: string | boolean;
}

export class AddCommand {
  constructor(private readonly deps: AddDeps) {}

  async run(icons: string[], options: AddOptions) {
    const {
      fs,
      config,
      hooks,
      icons: iconUtils,
      prompts,
      logger,
      frameworks,
    } = this.deps;

    // 1. Validate cwd exists
    if (!(await fs.access(options.cwd))) {
      return new Err(`Directory does not exist: ${options.cwd}`);
    }

    // 2. Validate --name with multiple icons
    if (options.name && icons.length > 1) {
      return new Err("--name can only be used with a single icon");
    }

    // 3. Validate all icon names
    for (const icon of icons) {
      const validation = iconUtils.validateIconName(icon);
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
    const configResult = await config.loadConfig(options.cwd);
    if (configResult.isErr()) {
      return configResult;
    }
    const cfg = configResult.value;

    // 6. Load framework strategy
    const strategy = await frameworks.createStrategy(cfg.framework);

    // 7. Run preAdd hooks
    const preAddResult = await hooks.runHooks(cfg.hooks?.preAdd, options.cwd);
    if (preAddResult.isErr()) {
      return preAddResult;
    }

    // 8. Read icons file
    const iconsPath = path.resolve(options.cwd, cfg.output);
    if (!(await fs.access(iconsPath))) {
      return new Err(
        `Icons file not found: ${cfg.output}. Run "denji init" first.`
      );
    }

    const iconsFileResult = await fs.readFile(iconsPath, "utf-8");
    if (iconsFileResult.isErr()) {
      return new Err(`Failed to read icons file: ${cfg.output}`);
    }

    let iconsContent = iconsFileResult.value;
    const existingIcons = iconUtils.getExistingIconNames(iconsContent);
    let addedCount = 0;

    // Get framework-specific options
    const frameworkOptions =
      (cfg[strategy.getConfigKey() as keyof Config] as FrameworkOptions) ?? {};
    const useForwardRef = strategy.isForwardRefEnabled(frameworkOptions);

    // 9. Process each icon
    for (const icon of icons) {
      const componentName = options.name ?? iconUtils.toComponentName(icon);

      // Check if exists
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

      // Fetch icon
      const svgResult = await iconUtils.fetchIcon(icon);
      if (svgResult.isErr()) {
        logger.error(`Failed to fetch ${icon}: ${svgResult.error}`);
        continue;
      }

      // Convert to component using framework strategy
      const component = await strategy.transformSvg(
        svgResult.value,
        {
          a11y: a11yOverride ?? cfg.a11y,
          trackSource: cfg.trackSource ?? true,
          iconName: icon,
          componentName,
        },
        frameworkOptions
      );

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

    // 10. Write updated file and run postAdd hooks
    if (addedCount > 0) {
      const writeResult = await fs.writeFile(iconsPath, iconsContent);
      if (writeResult.isErr()) {
        return new Err(`Failed to write icons file: ${cfg.output}`);
      }

      const postAddResult = await hooks.runHooks(
        cfg.hooks?.postAdd,
        options.cwd
      );
      if (postAddResult.isErr()) {
        return postAddResult;
      }
    }

    return new Ok(null);
  }
}

export function createAddCommand(): AddCommand {
  return new AddCommand(addDefaults);
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

    const command = createAddCommand();

    const result = await command.run(icons, options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro(`Added ${icons.length} icon(s)`);
  });
