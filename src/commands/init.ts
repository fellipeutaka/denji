import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import {
  CONFIG_FILE,
  type Config,
  type Framework,
  configSchema,
  frameworkSchema,
} from "~/schemas/config";
import { getIconsTemplate } from "~/templates/icons";
import { access, mkdir, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

interface InitOptions {
  cwd: string;
  output?: string;
  framework?: string;
  typescript?: boolean;
}

export const init = new Command()
  .name("init")
  .description("Initialize a new denji project")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .option("--output <file>", "Output file path for icons")
  .option("--framework <framework>", "Framework to use")
  .option("--typescript", "Use TypeScript", true)
  .option("--no-typescript", "Use JavaScript")
  .action(async (options: InitOptions) => {
    intro("denji init");

    const result = await runInit(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro("Project initialized successfully!");
  });

async function runInit(options: InitOptions) {
  // 1. Validate cwd exists
  if (!(await access(options.cwd))) {
    return new Err(`Directory does not exist: ${options.cwd}`);
  }

  // 2. Check if denji.json already exists
  const configPath = path.join(options.cwd, CONFIG_FILE);
  if (await access(configPath)) {
    return new Err(`${CONFIG_FILE} already exists in ${options.cwd}`);
  }

  // 3. Get config values (from flags or prompts)
  const configResult = await resolveConfig(options);
  if (configResult.isErr()) {
    return configResult;
  }
  const config = configResult.value;

  // 4. Validate output extension
  const extensionResult = validateExtension(config);
  if (extensionResult.isErr()) {
    return extensionResult;
  }

  // 5. Check if output file already exists
  const outputPath = path.resolve(options.cwd, config.output);
  if (await access(outputPath)) {
    return new Err(`Output file already exists: ${outputPath}`);
  }

  // 6. Create parent directory for output if needed
  const outputDir = path.dirname(outputPath);
  if (!(await access(outputDir))) {
    const mkdirResult = await mkdir(outputDir, { recursive: true });
    if (mkdirResult.isErr()) {
      return new Err(`Failed to create directory: ${outputDir}`);
    }
  }

  // 7. Write denji.json
  const configContent = JSON.stringify(config, null, 2);
  const writeConfigResult = await writeFile(configPath, configContent);
  if (writeConfigResult.isErr()) {
    return new Err(`Failed to write ${CONFIG_FILE}`);
  }
  logger.success(`Created ${CONFIG_FILE}`);

  // 8. Write icons file
  const iconsContent = getIconsTemplate(config);
  const writeIconsResult = await writeFile(outputPath, iconsContent);
  if (writeIconsResult.isErr()) {
    return new Err(`Failed to write ${config.output}`);
  }
  logger.success(`Created ${config.output}`);

  return new Ok(null);
}

async function resolveConfig(options: InitOptions) {
  const output =
    options.output ??
    (await enhancedText({
      message: "Where should icons be created?",
      defaultValue: "./src/icons.tsx",
    }));

  const frameworkInput =
    options.framework ??
    (await enhancedSelect({
      message: "Which framework are you using?",
      options: [{ value: "react", label: "React" }],
      initialValue: "react",
    }));

  const frameworkResult = frameworkSchema.safeParse(frameworkInput);
  if (!frameworkResult.success) {
    return new Err(`Invalid framework: ${frameworkInput}. Use: react`);
  }
  const framework: Framework = frameworkResult.data;

  const typescript =
    options.typescript ??
    (await enhancedConfirm({
      message: "Use TypeScript?",
      initialValue: true,
    }));

  const config = configSchema.parse({ output, framework, typescript });
  return new Ok(config);
}

function validateExtension(config: Config) {
  const ext = path.extname(config.output);

  if (config.framework === "react") {
    if (config.typescript && ext !== ".tsx") {
      return new Err(
        `Invalid extension "${ext}" for React + TypeScript. Use ".tsx"`
      );
    }
    if (!config.typescript && ext !== ".jsx") {
      return new Err(`Invalid extension "${ext}" for React + JavaScript. Use ".jsx"`);
    }
  }

  return new Ok(null);
}
