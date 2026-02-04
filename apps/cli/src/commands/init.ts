import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import { getFrameworkOptions } from "~/frameworks/registry";
import type { FrameworkOptions, FrameworkStrategy } from "~/frameworks/types";
import {
  a11ySchema,
  CONFIG_FILE,
  type Config,
  configSchema,
  frameworkSchema,
} from "~/schemas/config";
import { initDefaults } from "~/services/defaults";
import type { InitDeps } from "~/services/deps";
import { handleError } from "~/utils/handle-error";
import { Err, Ok } from "~/utils/result";

export interface InitOptions {
  cwd: string;
  output?: string;
  framework?: string;
  typescript?: boolean;
  a11y?: string;
  trackSource?: boolean;
  forwardRef?: boolean;
}

export class InitCommand {
  constructor(private readonly deps: InitDeps) {}

  async run(options: InitOptions) {
    const { fs, logger } = this.deps;

    // 1. Validate cwd exists
    if (!(await fs.access(options.cwd))) {
      return new Err(`Directory does not exist: ${options.cwd}`);
    }

    // 2. Check if denji.json already exists
    const configPath = path.join(options.cwd, CONFIG_FILE);
    if (await fs.access(configPath)) {
      return new Err(`${CONFIG_FILE} already exists in ${options.cwd}`);
    }

    // 3. Get config values (from flags or prompts)
    const configResult = await this.resolveConfig(options);
    if (configResult.isErr()) {
      return configResult;
    }
    const { config, strategy } = configResult.value;

    // 4. Validate output extension using strategy
    const extensionResult = this.validateExtension(config, strategy);
    if (extensionResult.isErr()) {
      return extensionResult;
    }

    // 5. Check if output file already exists
    const outputPath = path.resolve(options.cwd, config.output);
    if (await fs.access(outputPath)) {
      return new Err(`Output file already exists: ${outputPath}`);
    }

    // 6. Create parent directory for output if needed
    const outputDir = path.dirname(outputPath);
    if (!(await fs.access(outputDir))) {
      const mkdirResult = await fs.mkdir(outputDir, { recursive: true });
      if (mkdirResult.isErr()) {
        return new Err(`Failed to create directory: ${outputDir}`);
      }
    }

    // 7. Write denji.json
    const configContent = JSON.stringify(config, null, 2);
    const writeConfigResult = await fs.writeFile(configPath, configContent);
    if (writeConfigResult.isErr()) {
      return new Err(`Failed to write ${CONFIG_FILE}`);
    }
    logger.success(`Created ${CONFIG_FILE}`);

    // 8. Write icons file using strategy template
    const frameworkOptions =
      (config[strategy.getConfigKey() as keyof Config] as FrameworkOptions) ??
      {};
    const iconsContent = strategy.getIconsTemplate({
      typescript: config.typescript,
      frameworkOptions,
    });
    const writeIconsResult = await fs.writeFile(outputPath, iconsContent);
    if (writeIconsResult.isErr()) {
      return new Err(`Failed to write ${config.output}`);
    }
    logger.success(`Created ${config.output}`);

    return new Ok(null);
  }

  async resolveConfig(options: InitOptions) {
    const { prompts, frameworks } = this.deps;

    const output =
      options.output ??
      (await prompts.text({
        message: "Where should icons be created?",
        defaultValue: "./src/icons.tsx",
      }));

    const frameworkInput =
      options.framework ??
      (await prompts.select({
        message: "Which framework are you using?",
        options: getFrameworkOptions(),
        initialValue: "react",
      }));

    const frameworkResult = frameworkSchema.safeParse(frameworkInput);
    if (!frameworkResult.success) {
      return new Err(
        `Invalid framework: ${frameworkInput}. Use: react, preact`
      );
    }
    const framework = frameworkResult.data;

    // Load framework strategy
    const strategy = await frameworks.createStrategy(framework);

    const typescript =
      options.typescript ??
      (await prompts.confirm({
        message: "Use TypeScript?",
        initialValue: true,
      }));

    const a11yInput =
      options.a11y ??
      (await prompts.select({
        message: "Which accessibility strategy should be used?",
        options: [
          {
            value: "hidden",
            label: "aria-hidden",
            hint: "Hide from screen readers (decorative icons)",
          },
          {
            value: "img",
            label: 'role="img"',
            hint: "Meaningful icon with aria-label",
          },
          {
            value: "title",
            label: "title",
            hint: "Add <title> element inside SVG",
          },
          {
            value: "presentation",
            label: "presentation",
            hint: "role=presentation (older pattern)",
          },
          { value: false, label: "false", hint: "No accessibility attributes" },
        ],
        initialValue: "hidden",
      }));

    const a11yResult = a11ySchema.safeParse(a11yInput);
    if (!a11yResult.success) {
      return new Err(
        `Invalid a11y strategy: ${a11yInput}. Use: hidden, img, title, presentation, false`
      );
    }
    const a11y = a11yResult.data;

    const trackSource =
      options.trackSource ??
      (await prompts.confirm({
        message:
          "Track Iconify source names? (for update command, debugging, identifying collections)",
        initialValue: true,
      }));

    // Get framework-specific options using strategy
    const frameworkOptions = await strategy.promptOptions({
      forwardRef: options.forwardRef,
    });

    const config = configSchema.parse({
      output,
      framework,
      typescript,
      a11y,
      trackSource,
      [strategy.getConfigKey()]: frameworkOptions,
    });

    return new Ok({ config, strategy });
  }

  validateExtension(config: Config, strategy: FrameworkStrategy) {
    const ext = path.extname(config.output);
    const expectedExt = config.typescript
      ? strategy.fileExtensions.typescript
      : strategy.fileExtensions.javascript;

    if (ext !== expectedExt) {
      const lang = config.typescript ? "TypeScript" : "JavaScript";
      return new Err(
        `Invalid extension "${ext}" for ${strategy.name} + ${lang}. Use "${expectedExt}"`
      );
    }

    return new Ok(null);
  }
}

export function createInitCommand(): InitCommand {
  return new InitCommand(initDefaults);
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
  .option("--typescript", "Use TypeScript")
  .option("--no-typescript", "Use JavaScript")
  .option("--a11y <strategy>", "Accessibility strategy for SVG icons")
  .option("--track-source", "Track Iconify source names")
  .option("--no-track-source", "Don't track Iconify source names")
  .option("--forward-ref", "Use forwardRef for React icon components")
  .option("--no-forward-ref", "Don't use forwardRef for React icon components")
  .action(async (options: InitOptions) => {
    intro("denji init");

    const command = createInitCommand();

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro("Project initialized successfully!");
  });
