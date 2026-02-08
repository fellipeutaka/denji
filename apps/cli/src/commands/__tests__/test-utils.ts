import { mock } from "bun:test";
import { addFileMode } from "~/commands/modes/add-file";
import { clearFileMode } from "~/commands/modes/clear-file";
import { listFileMode } from "~/commands/modes/list-file";
import { removeFileMode } from "~/commands/modes/remove-file";
import type { Config } from "~/schemas/config";
import type {
  AddDeps,
  ClearDeps,
  ConfigLoader,
  FileSystem,
  FrameworkFactory,
  HooksRunner,
  IconService,
  InitDeps,
  ListDeps,
  Logger,
  Prompter,
  RemoveDeps,
} from "~/services/deps";
import {
  getExistingIconNames,
  insertIconAlphabetically,
  parseIconsFile,
  replaceIcon,
} from "~/utils/icons";
import { Err, Ok } from "~/utils/result";

// ============================================================================
// Default Test Config
// ============================================================================

export const defaultTestConfig: Config = {
  $schema: "https://denji-docs.vercel.app/configuration_schema.json",
  output: { type: "file", path: "./src/icons.tsx" },
  framework: "react",
  typescript: true,
  trackSource: true,
  react: {
    forwardRef: false,
  },
};

// ============================================================================
// Default Test Icons File Content
// ============================================================================

export const emptyIconsFileContent = `export const Icons = {} as const;
`;

export const sampleIconsFileContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
} as const;
`;

// ============================================================================
// Mock Factories
// ============================================================================

export function createMockFs(overrides: Partial<FileSystem> = {}): FileSystem {
  return {
    access: mock(() => Promise.resolve(true)),
    readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
    writeFile: mock(() => Promise.resolve(new Ok(null))),
    mkdir: mock(() => Promise.resolve(new Ok(null))),
    readdir: mock(() => Promise.resolve(new Ok([]))),
    unlink: mock(() => Promise.resolve(new Ok(null))),
    ...overrides,
  };
}

export function createMockConfig(
  overrides: Partial<ConfigLoader> = {}
): ConfigLoader {
  return {
    loadConfig: mock(() => Promise.resolve(new Ok(defaultTestConfig))),
    ...overrides,
  };
}

export function createMockHooks(
  overrides: Partial<HooksRunner> = {}
): HooksRunner {
  return {
    runHooks: mock(() => Promise.resolve(new Ok(null))),
    ...overrides,
  };
}

export function createMockIcons(
  overrides: Partial<IconService> = {}
): IconService {
  return {
    fetchIcon: mock(() => Promise.resolve(new Ok("<svg></svg>"))),
    validateIconName: mock(() => new Ok({ prefix: "mdi", name: "home" })),
    toComponentName: mock((icon: string) => {
      const name = icon.split(":")[1] ?? "";
      return name.charAt(0).toUpperCase() + name.slice(1);
    }),
    parseIconsFile, // Use real implementation
    getExistingIconNames, // Use real implementation
    insertIconAlphabetically, // Use real implementation
    replaceIcon, // Use real implementation
    removeIcon: mock((content: string) => content),
    ...overrides,
  };
}

export function createMockPrompter(
  overrides: Partial<Prompter> = {}
): Prompter {
  return {
    confirm: mock(() => Promise.resolve(true)),
    select: mock(() => Promise.resolve("react")) as Prompter["select"],
    text: mock(() => Promise.resolve("./src/icons.tsx")),
    multiselect: mock(() => Promise.resolve([])),
    ...overrides,
  };
}

export function createMockLogger(overrides: Partial<Logger> = {}): Logger {
  return {
    error: mock(() => undefined),
    warn: mock(() => undefined),
    info: mock(() => undefined),
    success: mock(() => undefined),
    break: mock(() => undefined),
    ...overrides,
  };
}

export function createMockFrameworks(
  overrides: Partial<FrameworkFactory> = {}
): FrameworkFactory {
  // Use real createFrameworkStrategy - templates are tested properly
  // Note: When using this, always pass forwardRef option to avoid prompts
  return {
    createStrategy: async (name) => {
      const { createFrameworkStrategy } = await import("~/frameworks/factory");
      const strategy = await createFrameworkStrategy(name);
      // Wrap promptOptions to avoid real prompts - return default
      // Wrap transformSvg for tests that don't need real SVGR processing
      return {
        ...strategy,
        promptOptions: (context) => {
          // Use provided context or return default
          return Promise.resolve({ forwardRef: context.forwardRef ?? false });
        },
        transformSvg: (_svg, opts, frameworkOptions) => {
          const useForwardRef = strategy.isForwardRefEnabled(
            frameworkOptions ?? {}
          );
          if (useForwardRef) {
            return Promise.resolve(
              `${opts.componentName}: forwardRef<SVGSVGElement, IconProps>((props, ref) => (<svg ref={ref} {...props}></svg>))`
            );
          }
          return Promise.resolve(
            `${opts.componentName}: (props) => (<svg {...props}></svg>)`
          );
        },
      };
    },
    ...overrides,
  };
}

// ============================================================================
// Per-Command Mock Deps Factories
// ============================================================================

export function createListDeps(overrides: Partial<ListDeps> = {}): ListDeps {
  return {
    fs: createMockFs(overrides.fs),
    config: createMockConfig(overrides.config),
    hooks: createMockHooks(overrides.hooks),
    icons: createMockIcons(overrides.icons),
    logger: createMockLogger(overrides.logger),
    frameworks: createMockFrameworks(overrides.frameworks),
    runFileMode: overrides.runFileMode ?? listFileMode,
    runFolderMode:
      overrides.runFolderMode ?? mock(() => Promise.resolve(new Ok(null))),
  };
}

export function createClearDeps(overrides: Partial<ClearDeps> = {}): ClearDeps {
  return {
    fs: createMockFs(overrides.fs),
    config: createMockConfig(overrides.config),
    hooks: createMockHooks(overrides.hooks),
    icons: createMockIcons(overrides.icons),
    prompts: createMockPrompter(overrides.prompts),
    logger: createMockLogger(overrides.logger),
    frameworks: createMockFrameworks(overrides.frameworks),
    runFileMode: overrides.runFileMode ?? clearFileMode,
    runFolderMode:
      overrides.runFolderMode ?? mock(() => Promise.resolve(new Ok(null))),
  };
}

export function createRemoveDeps(
  overrides: Partial<RemoveDeps> = {}
): RemoveDeps {
  return {
    fs: createMockFs(overrides.fs),
    config: createMockConfig(overrides.config),
    hooks: createMockHooks(overrides.hooks),
    icons: createMockIcons(overrides.icons),
    prompts: createMockPrompter(overrides.prompts),
    logger: createMockLogger(overrides.logger),
    frameworks: createMockFrameworks(overrides.frameworks),
    runFileMode: overrides.runFileMode ?? removeFileMode,
    runFolderMode:
      overrides.runFolderMode ?? mock(() => Promise.resolve(new Ok(null))),
  };
}

export function createInitDeps(overrides: Partial<InitDeps> = {}): InitDeps {
  return {
    fs: createMockFs(overrides.fs),
    prompts: createMockPrompter(overrides.prompts),
    logger: createMockLogger(overrides.logger),
    frameworks: createMockFrameworks(overrides.frameworks),
    initFolderMode:
      overrides.initFolderMode ?? mock(() => Promise.resolve(new Ok(null))),
  };
}

export function createAddDeps(overrides: Partial<AddDeps> = {}): AddDeps {
  return {
    fs: createMockFs(overrides.fs),
    config: createMockConfig(overrides.config),
    hooks: createMockHooks(overrides.hooks),
    icons: createMockIcons(overrides.icons),
    prompts: createMockPrompter(overrides.prompts),
    logger: createMockLogger(overrides.logger),
    frameworks: createMockFrameworks(overrides.frameworks),
    runFileMode: overrides.runFileMode ?? addFileMode,
    runFolderMode:
      overrides.runFolderMode ?? mock(() => Promise.resolve(new Ok(null))),
  };
}

// ============================================================================
// Config Builder Helpers
// ============================================================================

export function withConfig(config: Partial<Config>): ConfigLoader {
  return createMockConfig({
    loadConfig: mock(() =>
      Promise.resolve(new Ok({ ...defaultTestConfig, ...config }))
    ),
  });
}

export function withConfigError(error: string): ConfigLoader {
  return createMockConfig({
    loadConfig: mock(() => Promise.resolve(new Err(error))),
  });
}

export function withHooks(hooks: Config["hooks"]): ConfigLoader {
  return createMockConfig({
    loadConfig: mock(() =>
      Promise.resolve(new Ok({ ...defaultTestConfig, hooks }))
    ),
  });
}
