import type { ZodMiniType } from "zod/mini";
import type { A11y } from "~/schemas/config";

/**
 * Framework-specific options from config (e.g., { forwardRef: boolean })
 */
export type FrameworkOptions = Record<string, unknown>;

/**
 * Options for generating an icon component
 */
export interface ComponentOptions {
  a11y?: A11y;
  trackSource?: boolean;
  iconName: string;
  forwardRef: boolean;
}

/**
 * Configuration passed to template generation
 */
export interface TemplateConfig {
  typescript: boolean;
  frameworkOptions: FrameworkOptions;
}

/**
 * Prompt context for framework-specific prompts
 */
export interface PromptContext {
  forwardRef?: boolean;
}

/**
 * Strategy interface for framework-specific behavior
 *
 * Each framework implements this interface to define:
 * - File extensions for TS/JS
 * - Schema for validation
 * - Template generation
 * - Import handling
 * - User prompts
 */
export interface FrameworkStrategy {
  /** Framework identifier */
  name: string;

  /** File extensions for TypeScript and JavaScript */
  fileExtensions: {
    typescript: string;
    javascript: string;
  };

  /** Zod schema for framework-specific options */
  optionsSchema: ZodMiniType;

  /** Whether this framework supports ref forwarding */
  supportsRef: boolean;

  /**
   * Generate the initial icons file template
   */
  getIconsTemplate(config: TemplateConfig): string;

  /**
   * Get required imports for the icons file
   */
  getImports(options: FrameworkOptions): string[];

  /**
   * Get the import source for forwardRef (e.g., "react" or "preact/compat")
   */
  getForwardRefImportSource(): string;

  /**
   * Check if forwardRef is enabled in framework options
   */
  isForwardRefEnabled(options: FrameworkOptions): boolean;

  /**
   * Prompt user for framework-specific options
   */
  promptOptions(context: PromptContext): Promise<FrameworkOptions>;

  /**
   * Get the config key for framework options (e.g., "react" or "preact")
   */
  getConfigKey(): string;
}
