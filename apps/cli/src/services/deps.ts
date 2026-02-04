import type { ConfirmOptions, TextOptions } from "@clack/prompts";
import type { FrameworkStrategy } from "~/frameworks/types";
import type { Config, Framework } from "~/schemas/config";
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
// Per-Command Dependency Types
// ============================================================================

export interface ListDeps {
  fs: Pick<FileSystem, "access" | "readFile">;
  config: ConfigLoader;
  hooks: HooksRunner;
  icons: Pick<IconService, "parseIconsFile">;
  logger: Logger;
}

export interface ClearDeps {
  fs: Pick<FileSystem, "access" | "readFile" | "writeFile">;
  config: ConfigLoader;
  hooks: HooksRunner;
  icons: Pick<IconService, "getExistingIconNames">;
  prompts: Pick<Prompter, "confirm">;
  logger: Logger;
  frameworks: FrameworkFactory;
}

export interface RemoveDeps {
  fs: Pick<FileSystem, "access" | "readFile" | "writeFile">;
  config: ConfigLoader;
  hooks: HooksRunner;
  icons: Pick<IconService, "getExistingIconNames" | "removeIcon">;
  prompts: Pick<Prompter, "multiselect">;
  logger: Logger;
  frameworks: FrameworkFactory;
}

export interface InitDeps {
  fs: Pick<FileSystem, "access" | "mkdir" | "writeFile">;
  prompts: Prompter;
  logger: Logger;
  frameworks: FrameworkFactory;
}

export interface AddDeps {
  fs: Pick<FileSystem, "access" | "readFile" | "writeFile">;
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
}
