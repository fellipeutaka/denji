import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { loadConfig } from "~/utils/config";
import { access, readFile, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
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

interface AddOptions {
  cwd: string;
  name?: string;
}

export const add = new Command()
  .name("add")
  .description("Add icons to your project")
  .argument("<icons...>", "Icon names (e.g., mdi:home lucide:check)")
  .option("--name <name>", "Custom component name (single icon only)")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (icons: string[], options: AddOptions) => {
    intro("denji add");

    const result = await runAdd(icons, options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro(`Added ${icons.length} icon(s)`);
  });

async function runAdd(icons: string[], options: AddOptions) {
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

  // 4. Load config
  const configResult = await loadConfig(options.cwd);
  if (configResult.isErr()) {
    return configResult;
  }
  const config = configResult.value;

  // 5. Read icons file
  const iconsPath = path.resolve(options.cwd, config.output);
  if (!(await access(iconsPath))) {
    return new Err(`Icons file not found: ${config.output}. Run "denji init" first.`);
  }

  const iconsFileResult = await readFile<string>(iconsPath, "utf-8");
  if (iconsFileResult.isErr()) {
    return new Err(`Failed to read icons file: ${config.output}`);
  }

  let iconsContent = iconsFileResult.value;
  const existingIcons = getExistingIconNames(iconsContent);
  let addedCount = 0;

  // 6. Process each icon
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
    const component = await svgToComponent(svgResult.value, componentName);

    // Insert or replace
    if (existingIcons.includes(componentName)) {
      iconsContent = replaceIcon(iconsContent, componentName, component);
      logger.success(`Replaced ${componentName}`);
    } else {
      iconsContent = insertIconAlphabetically(iconsContent, componentName, component);
      existingIcons.push(componentName);
      logger.success(`Added ${componentName}`);
    }

    addedCount++;
  }

  // 7. Write updated file
  if (addedCount > 0) {
    const writeResult = await writeFile(iconsPath, iconsContent);
    if (writeResult.isErr()) {
      return new Err(`Failed to write icons file: ${config.output}`);
    }
  }

  return new Ok(null);
}
