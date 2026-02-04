import { createFrameworkStrategy } from "~/frameworks/factory";
import { loadConfig } from "~/utils/config";
import { access, mkdir, readFile, writeFile } from "~/utils/fs";
import { runHooks } from "~/utils/hooks";
import {
  fetchIcon,
  getExistingIconNames,
  insertIconAlphabetically,
  parseIconsFile,
  removeIcon,
  replaceIcon,
  toComponentName,
  validateIconName,
} from "~/utils/icons";
import { logger } from "~/utils/logger";
import {
  enhancedConfirm,
  enhancedMultiselect,
  enhancedSelect,
  enhancedText,
} from "~/utils/prompts";
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
} from "./deps";

// ============================================================================
// Default Implementations
// ============================================================================

export const defaultFs: FileSystem = {
  access,
  readFile,
  writeFile,
  mkdir,
};

export const defaultConfig: ConfigLoader = {
  loadConfig,
};

export const defaultHooks: HooksRunner = {
  runHooks,
};

export const defaultIcons: IconService = {
  fetchIcon,
  validateIconName,
  toComponentName,
  parseIconsFile,
  getExistingIconNames,
  insertIconAlphabetically,
  replaceIcon,
  removeIcon,
};

export const defaultPrompts: Prompter = {
  confirm: enhancedConfirm,
  select: enhancedSelect,
  text: enhancedText,
  multiselect: enhancedMultiselect,
};

export const defaultLogger: Logger = logger;

export const defaultFrameworks: FrameworkFactory = {
  createStrategy: createFrameworkStrategy,
};

// ============================================================================
// Per-Command Default Aggregates
// ============================================================================

export const listDefaults: ListDeps = {
  fs: defaultFs,
  config: defaultConfig,
  hooks: defaultHooks,
  icons: defaultIcons,
  logger: defaultLogger,
};

export const clearDefaults: ClearDeps = {
  fs: defaultFs,
  config: defaultConfig,
  hooks: defaultHooks,
  icons: defaultIcons,
  prompts: defaultPrompts,
  logger: defaultLogger,
  frameworks: defaultFrameworks,
};

export const removeDefaults: RemoveDeps = {
  fs: defaultFs,
  config: defaultConfig,
  hooks: defaultHooks,
  icons: defaultIcons,
  prompts: defaultPrompts,
  logger: defaultLogger,
  frameworks: defaultFrameworks,
};

export const initDefaults: InitDeps = {
  fs: defaultFs,
  prompts: defaultPrompts,
  logger: defaultLogger,
  frameworks: defaultFrameworks,
};

export const addDefaults: AddDeps = {
  fs: defaultFs,
  config: defaultConfig,
  hooks: defaultHooks,
  icons: defaultIcons,
  prompts: defaultPrompts,
  logger: defaultLogger,
  frameworks: defaultFrameworks,
};
