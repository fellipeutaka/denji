import path from "node:path";
import { frameworkDisplayNames } from "~/frameworks/registry";
import {
  CONFIG_FILE,
  type Config,
  configSchema,
  FOLDER_ONLY_FRAMEWORKS,
  type Framework,
  type OutputConfig,
} from "~/schemas/config";
import { access, readFile } from "~/utils/fs";
import { Err, Ok } from "~/utils/result";

const FRAMEWORK_EXTENSIONS: Record<
  Framework,
  { typescript: string; javascript: string }
> = {
  react: { typescript: ".tsx", javascript: ".jsx" },
  preact: { typescript: ".tsx", javascript: ".jsx" },
  solid: { typescript: ".tsx", javascript: ".jsx" },
  vue: { typescript: ".ts", javascript: ".js" },
  svelte: { typescript: ".svelte", javascript: ".svelte" },
};

function normalizeOutput(
  output: string | { type: string; path: string }
): OutputConfig {
  if (typeof output === "string") {
    return { type: "file", path: output };
  }
  return output as OutputConfig;
}

function validateOutput(config: Config) {
  const displayName = frameworkDisplayNames[config.framework];

  if (
    config.output.type === "file" &&
    FOLDER_ONLY_FRAMEWORKS.has(config.framework)
  ) {
    return new Err(
      `${displayName} only supports folder output mode. Use { "type": "folder", "path": "..." }`
    );
  }

  if (config.output.type === "folder") {
    return new Ok(null);
  }

  const expected = FRAMEWORK_EXTENSIONS[config.framework];
  const expectedExt = config.typescript
    ? expected.typescript
    : expected.javascript;
  const actualExt = path.extname(config.output.path);

  if (actualExt !== expectedExt) {
    const lang = config.typescript ? "TypeScript" : "JavaScript";
    return new Err(
      `Invalid extension "${actualExt}" for ${displayName} + ${lang}. Use "${expectedExt}"`
    );
  }

  return new Ok(null);
}

export async function loadConfig(cwd: string) {
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!(await access(configPath))) {
    return new Err(`${CONFIG_FILE} not found. Run "denji init" first.`);
  }

  const content = await readFile(configPath, "utf-8");
  if (content.isErr()) {
    return new Err(`Failed to read ${CONFIG_FILE}`);
  }

  try {
    const parsed = configSchema.safeParse(JSON.parse(content.value));
    if (!parsed.success) {
      return new Err(`Invalid ${CONFIG_FILE}: ${parsed.error.message}`);
    }

    const config: Config = {
      ...parsed.data,
      output: normalizeOutput(parsed.data.output),
    };

    const extensionResult = validateOutput(config);
    if (extensionResult.isErr()) {
      return extensionResult;
    }

    return new Ok(config);
  } catch {
    return new Err(`Invalid JSON in ${CONFIG_FILE}`);
  }
}
