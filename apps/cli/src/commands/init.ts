import path from "node:path";
import { intro, outro } from "@clack/prompts";
import { Command } from "commander";
import {
  a11ySchema,
  CONFIG_FILE,
  type Config,
  configSchema,
  frameworkSchema,
} from "~/schemas/config";
import { getIconsTemplate } from "~/templates/icons";
import { access, mkdir, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
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

    const command = new InitCommand();

    const result = await command.run(options);
    if (result.isErr()) {
      handleError(result.error);
    }

    outro("Project initialized successfully!");
  });

export class InitCommand {
  async run(options: InitOptions) {
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
    const configResult = await this.resolveConfig(options);
    if (configResult.isErr()) {
      return configResult;
    }
    const config = configResult.value;

    // 4. Validate output extension
    const extensionResult = this.validateExtension(config);
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

  async resolveConfig(options: InitOptions) {
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
        options: [
          { value: "react", label: "React" },
          { value: "preact", label: "Preact" },
        ],
        initialValue: "react",
      }));

    const frameworkResult = frameworkSchema.safeParse(frameworkInput);
    if (!frameworkResult.success) {
      return new Err(
        `Invalid framework: ${frameworkInput}. Use: react, preact`
      );
    }
    const framework = frameworkResult.data;

    const typescript =
      options.typescript ??
      (await enhancedConfirm({
        message: "Use TypeScript?",
        initialValue: true,
      }));

    const a11yInput =
      options.a11y ??
      (await enhancedSelect({
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
      (await enhancedConfirm({
        message:
          "Track Iconify source names? (for update command, debugging, identifying collections)",
        initialValue: true,
      }));

    // Get framework-specific options
    const frameworkOptions = await this.promptFrameworkOptions(
      framework,
      options
    );

    const config = configSchema.parse({
      output,
      framework,
      typescript,
      a11y,
      trackSource,
      ...frameworkOptions,
    });
    return new Ok(config);
  }

  promptFrameworkOptions(
    framework: string,
    options: InitOptions
  ): Promise<Record<string, unknown>> {
    if (framework === "react") {
      return this.promptReactOptions(options);
    }
    if (framework === "preact") {
      return this.promptPreactOptions(options);
    }
    return Promise.resolve({});
  }

  async promptReactOptions(options: InitOptions) {
    const forwardRef =
      options.forwardRef ??
      (await enhancedConfirm({
        message: "Use forwardRef for icon components?",
        initialValue: false,
      }));

    return { react: { forwardRef } };
  }

  async promptPreactOptions(options: InitOptions) {
    const forwardRef =
      options.forwardRef ??
      (await enhancedConfirm({
        message: "Use forwardRef for icon components?",
        initialValue: false,
      }));

    return { preact: { forwardRef } };
  }

  validateExtension(config: Config) {
    const ext = path.extname(config.output);

    if (config.framework === "react") {
      if (config.typescript && ext !== ".tsx") {
        return new Err(
          `Invalid extension "${ext}" for React + TypeScript. Use ".tsx"`
        );
      }
      if (!config.typescript && ext !== ".jsx") {
        return new Err(
          `Invalid extension "${ext}" for React + JavaScript. Use ".jsx"`
        );
      }
    }

    if (config.framework === "preact") {
      if (config.typescript && ext !== ".tsx") {
        return new Err(
          `Invalid extension "${ext}" for Preact + TypeScript. Use ".tsx"`
        );
      }
      if (!config.typescript && ext !== ".jsx") {
        return new Err(
          `Invalid extension "${ext}" for Preact + JavaScript. Use ".jsx"`
        );
      }
    }

    return new Ok(null);
  }
}
