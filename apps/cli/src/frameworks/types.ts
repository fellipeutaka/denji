import type { ZodMiniType } from "zod/mini";
import type { A11y, OutputType } from "~/schemas/config";

/**
 * Framework-specific options from config (e.g., { forwardRef: boolean })
 */
export type FrameworkOptions = Record<string, unknown>;

/**
 * Options for transforming SVG to component
 */
export interface TransformSvgOptions {
  /** Accessibility strategy */
  a11y?: A11y;
  /** Component name (e.g., "Home") */
  componentName: string;
  /** Original icon name (e.g., "mdi:home") */
  iconName: string;
  /** Output mode: "file" for object properties, "folder" for standalone exports */
  outputMode?: OutputType;
  /** Add data-icon attribute with source name */
  trackSource?: boolean;
}

/**
 * Configuration passed to template generation
 */
export interface TemplateConfig {
  frameworkOptions: FrameworkOptions;
  typescript: boolean;
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
  /** File extensions for TypeScript and JavaScript */
  fileExtensions: {
    typescript: string;
    javascript: string;
  };

  /**
   * Get the config key for framework options (e.g., "react" or "preact")
   */
  getConfigKey(): string;

  /**
   * Get the import source for forwardRef (e.g., "react" or "preact/compat")
   */
  getForwardRefImportSource(): string;

  /**
   * Generate the initial icons file template
   */
  getIconsTemplate(config: TemplateConfig): string;

  /**
   * Generate types.ts content for folder mode (optional).
   * Only needed for folder-mode frameworks.
   */
  getTypesFileContent?(): string;

  /**
   * Check if forwardRef is enabled in framework options
   */
  isForwardRefEnabled(options: FrameworkOptions): boolean;
  /** Framework identifier */
  name: string;

  /** Zod schema for framework-specific options */
  optionsSchema: ZodMiniType;

  /** Preferred output type for this framework */
  preferredOutputType: OutputType;

  /**
   * Prompt user for framework-specific options
   */
  promptOptions(context: PromptContext): Promise<FrameworkOptions>;

  /** Whether this framework supports ref forwarding */
  supportsRef: boolean;

  /**
   * Transform raw SVG string into framework-specific component code
   *
   * Each framework handles:
   * - Attribute casing (camelCase for React/Preact, kebab-case for others)
   * - Component wrapping (forwardRef, defineComponent, etc.)
   * - Props spreading syntax
   */
  transformSvg(
    svg: string,
    options: TransformSvgOptions,
    frameworkOptions: FrameworkOptions
  ): Promise<string>;
}
