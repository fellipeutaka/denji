import type { ConfirmOptions, TextOptions } from "@clack/prompts";
import type { FrameworkOptions, FrameworkStrategy } from "~/frameworks/types";
import type { A11y, Config, Framework } from "~/schemas/config";
import type {
  MultiSelectOptions,
  Option,
  SelectOptions,
} from "~/utils/prompts";
import type { ResultType } from "~/utils/result";

// ============================================================================
// Core Dependency Interfaces
// ============================================================================

export interface FileSystem {
  access(path: string): Promise<boolean>;
  mkdir(
    path: string,
    options?: { recursive?: boolean }
  ): Promise<ResultType<null, string>>;
  readdir(path: string): Promise<ResultType<string[], string>>;
  readFile(
    path: string,
    encoding?: BufferEncoding
  ): Promise<ResultType<string, string>>;
  unlink(path: string): Promise<ResultType<null, string>>;
  writeFile(file: string, data: string): Promise<ResultType<null, string>>;
}

export interface ConfigLoader {
  loadConfig(cwd: string): Promise<ResultType<Config, string>>;
}

export interface HooksRunner {
  runHooks(hooks: string[], cwd: string): Promise<ResultType<null, string>>;
}

export interface IconService {
  fetchIcon(iconName: string): Promise<ResultType<string, string>>;
  getExistingIconNames(content: string): string[];
  insertIconAlphabetically(
    content: string,
    name: string,
    component: string
  ): string;
  parseIconsFile(content: string): {
    icons: { name: string; start: number; end: number; source?: string }[];
    objectStart: number;
    objectEnd: number;
  };
  removeIcon(content: string, name: string): string;
  replaceIcon(content: string, name: string, component: string): string;
  toComponentName(icon: string): string;
  validateIconName(
    icon: string
  ): ResultType<{ prefix: string; name: string }, string>;
}

export interface Prompter {
  confirm(opts: ConfirmOptions): Promise<boolean>;
  multiselect<const Value>(opts: MultiSelectOptions<Value>): Promise<Value[]>;
  select<const Options extends Option<Value>[], const Value>(
    opts: SelectOptions<Options, Value>
  ): Promise<Options[number]["value"]>;
  text(opts: TextOptions): Promise<string>;
}

export interface Logger {
  break(): void;
  error(msg: string): void;
  info(msg: string): void;
  success(msg: string): void;
  warn(msg: string): void;
}

export interface FrameworkFactory {
  createStrategy(name: Framework): Promise<FrameworkStrategy>;
}

// ============================================================================
// Mode Runner Types
// ============================================================================

export interface AddModeContext {
  a11yOverride: A11y | undefined;
  cfg: Config;
  frameworkOptions: FrameworkOptions;
  icons: string[];
  options: { cwd: string; name?: string; dryRun?: boolean };
  strategy: FrameworkStrategy;
}

export type AddModeRunner = (
  ctx: AddModeContext,
  deps: Pick<AddDeps, "fs" | "hooks" | "icons" | "prompts" | "logger">
) => Promise<ResultType<null, string>>;

export type RemoveModeRunner = (
  icons: string[],
  options: { cwd: string },
  cfg: Config,
  strategy: FrameworkStrategy,
  deps: Pick<RemoveDeps, "fs" | "hooks" | "icons" | "logger">
) => Promise<ResultType<null, string>>;

export type ClearModeRunner = (
  options: { cwd: string; yes: boolean },
  cfg: Config,
  strategy: FrameworkStrategy,
  deps: Pick<ClearDeps, "fs" | "hooks" | "icons" | "prompts" | "logger">
) => Promise<ResultType<null, string>>;

export type ListFileModeRunner = (
  options: { cwd: string; display?: "default" | "json" | "toon" },
  cfg: Config,
  deps: Pick<ListDeps, "fs" | "hooks" | "icons" | "logger">
) => Promise<ResultType<null, string>>;

export type ListFolderModeRunner = (
  options: { cwd: string; display?: "default" | "json" | "toon" },
  cfg: Config,
  strategy: FrameworkStrategy,
  deps: Pick<ListDeps, "fs" | "hooks" | "logger">
) => Promise<ResultType<null, string>>;

export type InitFolderModeRunner = (
  config: Config,
  strategy: FrameworkStrategy,
  outputPath: string,
  configPath: string,
  deps: Pick<InitDeps, "fs" | "logger">
) => Promise<ResultType<null, string>>;

export interface ExportManifest {
  framework: string;
  icons: Array<{ name: string; source?: string }>;
  output: string;
  version: 1;
}

export type ExportFileModeRunner = (
  options: { cwd: string; output?: string | boolean },
  cfg: Config,
  deps: Pick<ExportDeps, "fs" | "icons" | "logger">
) => Promise<ResultType<null, string>>;

export type ExportFolderModeRunner = (
  options: { cwd: string; output?: string | boolean },
  cfg: Config,
  strategy: FrameworkStrategy,
  deps: Pick<ExportDeps, "fs" | "logger">
) => Promise<ResultType<null, string>>;

// ============================================================================
// Per-Command Dependency Types
// ============================================================================

export interface ListDeps {
  config: ConfigLoader;
  frameworks: FrameworkFactory;
  fs: Pick<FileSystem, "access" | "readFile" | "readdir">;
  hooks: HooksRunner;
  icons: Pick<IconService, "parseIconsFile">;
  logger: Logger;
  runFileMode: ListFileModeRunner;
  runFolderMode: ListFolderModeRunner;
}

export interface ClearDeps {
  config: ConfigLoader;
  frameworks: FrameworkFactory;
  fs: Pick<
    FileSystem,
    "access" | "readFile" | "writeFile" | "readdir" | "unlink"
  >;
  hooks: HooksRunner;
  icons: Pick<IconService, "getExistingIconNames">;
  logger: Logger;
  prompts: Pick<Prompter, "confirm">;
  runFileMode: ClearModeRunner;
  runFolderMode: ClearModeRunner;
}

export interface RemoveDeps {
  config: ConfigLoader;
  frameworks: FrameworkFactory;
  fs: Pick<
    FileSystem,
    "access" | "readFile" | "writeFile" | "readdir" | "unlink"
  >;
  hooks: HooksRunner;
  icons: Pick<IconService, "getExistingIconNames" | "removeIcon">;
  logger: Logger;
  prompts: Pick<Prompter, "multiselect">;
  runFileMode: RemoveModeRunner;
  runFolderMode: RemoveModeRunner;
}

export interface InitDeps {
  frameworks: FrameworkFactory;
  fs: Pick<FileSystem, "access" | "mkdir" | "writeFile" | "readdir">;
  initFolderMode: InitFolderModeRunner;
  logger: Logger;
  prompts: Prompter;
}

export interface ExportDeps {
  config: ConfigLoader;
  frameworks: FrameworkFactory;
  fs: Pick<FileSystem, "access" | "readFile" | "readdir" | "writeFile">;
  icons: Pick<IconService, "parseIconsFile">;
  logger: Logger;
  runFileMode: ExportFileModeRunner;
  runFolderMode: ExportFolderModeRunner;
}

export interface ImportDeps {
  config: ConfigLoader;
  frameworks: FrameworkFactory;
  fs: Pick<FileSystem, "access" | "readFile" | "writeFile" | "readdir">;
  hooks: HooksRunner;
  icons: Pick<
    IconService,
    | "fetchIcon"
    | "validateIconName"
    | "toComponentName"
    | "getExistingIconNames"
    | "insertIconAlphabetically"
    | "replaceIcon"
  >;
  logger: Logger;
  prompts: Pick<Prompter, "confirm">;
  runAddFileMode: AddModeRunner;
  runAddFolderMode: AddModeRunner;
}

export interface AddDeps {
  config: ConfigLoader;
  frameworks: FrameworkFactory;
  fs: Pick<FileSystem, "access" | "readFile" | "writeFile" | "readdir">;
  hooks: HooksRunner;
  icons: Pick<
    IconService,
    | "fetchIcon"
    | "validateIconName"
    | "toComponentName"
    | "getExistingIconNames"
    | "insertIconAlphabetically"
    | "replaceIcon"
  >;
  logger: Logger;
  prompts: Pick<Prompter, "confirm">;
  runFileMode: AddModeRunner;
  runFolderMode: AddModeRunner;
}
