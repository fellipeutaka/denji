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
  readFile(
    path: string,
    encoding?: BufferEncoding
  ): Promise<ResultType<string, string>>;
  writeFile(file: string, data: string): Promise<ResultType<null, string>>;
  mkdir(
    path: string,
    options?: { recursive?: boolean }
  ): Promise<ResultType<null, string>>;
  readdir(path: string): Promise<ResultType<string[], string>>;
  unlink(path: string): Promise<ResultType<null, string>>;
}

export interface ConfigLoader {
  loadConfig(cwd: string): Promise<ResultType<Config, string>>;
}

export interface HooksRunner {
  runHooks(
    hooks: string[] | undefined,
    cwd: string
  ): Promise<ResultType<null, string>>;
}

export interface IconService {
  fetchIcon(iconName: string): Promise<ResultType<string, string>>;
  validateIconName(
    icon: string
  ): ResultType<{ prefix: string; name: string }, string>;
  toComponentName(icon: string): string;
  parseIconsFile(content: string): {
    icons: { name: string; start: number; end: number }[];
    objectStart: number;
    objectEnd: number;
  };
  getExistingIconNames(content: string): string[];
  insertIconAlphabetically(
    content: string,
    name: string,
    component: string
  ): string;
  replaceIcon(content: string, name: string, component: string): string;
  removeIcon(content: string, name: string): string;
}

export interface Prompter {
  confirm(opts: ConfirmOptions): Promise<boolean>;
  select<const Options extends Option<Value>[], const Value>(
    opts: SelectOptions<Options, Value>
  ): Promise<Options[number]["value"]>;
  text(opts: TextOptions): Promise<string>;
  multiselect<const Value>(opts: MultiSelectOptions<Value>): Promise<Value[]>;
}

export interface Logger {
  error(msg: string): void;
  warn(msg: string): void;
  info(msg: string): void;
  success(msg: string): void;
  break(): void;
}

export interface FrameworkFactory {
  createStrategy(name: Framework): Promise<FrameworkStrategy>;
}

// ============================================================================
// Mode Runner Types
// ============================================================================

export type AddModeRunner = (
  icons: string[],
  options: { cwd: string; name?: string },
  cfg: Config,
  strategy: FrameworkStrategy,
  frameworkOptions: FrameworkOptions,
  a11yOverride: A11y | undefined,
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
  options: { cwd: string; json?: boolean },
  cfg: Config,
  deps: Pick<ListDeps, "fs" | "hooks" | "icons" | "logger">
) => Promise<ResultType<null, string>>;

export type ListFolderModeRunner = (
  options: { cwd: string; json?: boolean },
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

// ============================================================================
// Per-Command Dependency Types
// ============================================================================

export interface ListDeps {
  fs: Pick<FileSystem, "access" | "readFile" | "readdir">;
  config: ConfigLoader;
  hooks: HooksRunner;
  icons: Pick<IconService, "parseIconsFile">;
  logger: Logger;
  frameworks: FrameworkFactory;
  runFileMode: ListFileModeRunner;
  runFolderMode: ListFolderModeRunner;
}

export interface ClearDeps {
  fs: Pick<
    FileSystem,
    "access" | "readFile" | "writeFile" | "readdir" | "unlink"
  >;
  config: ConfigLoader;
  hooks: HooksRunner;
  icons: Pick<IconService, "getExistingIconNames">;
  prompts: Pick<Prompter, "confirm">;
  logger: Logger;
  frameworks: FrameworkFactory;
  runFileMode: ClearModeRunner;
  runFolderMode: ClearModeRunner;
}

export interface RemoveDeps {
  fs: Pick<
    FileSystem,
    "access" | "readFile" | "writeFile" | "readdir" | "unlink"
  >;
  config: ConfigLoader;
  hooks: HooksRunner;
  icons: Pick<IconService, "getExistingIconNames" | "removeIcon">;
  prompts: Pick<Prompter, "multiselect">;
  logger: Logger;
  frameworks: FrameworkFactory;
  runFileMode: RemoveModeRunner;
  runFolderMode: RemoveModeRunner;
}

export interface InitDeps {
  fs: Pick<FileSystem, "access" | "mkdir" | "writeFile" | "readdir">;
  prompts: Prompter;
  logger: Logger;
  frameworks: FrameworkFactory;
  initFolderMode: InitFolderModeRunner;
}

export interface AddDeps {
  fs: Pick<FileSystem, "access" | "readFile" | "writeFile" | "readdir">;
  config: ConfigLoader;
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
  prompts: Pick<Prompter, "confirm">;
  logger: Logger;
  frameworks: FrameworkFactory;
  runFileMode: AddModeRunner;
  runFolderMode: AddModeRunner;
}
