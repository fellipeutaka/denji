import { z } from "zod";

export const frameworkSchema = z.enum(["react"]);
export type Framework = z.infer<typeof frameworkSchema>;

export const a11ySchema = z
  .enum(["hidden", "img", "title", "presentation"])
  .or(z.literal(false));
export type A11y = z.infer<typeof a11ySchema>;

export const configSchema = z
  .object({
    $schema: z
      .string()
      .optional()
      .describe(
        "The URL of the JSON Schema for this configuration file (e.g., './node_modules/denji/configuration_schema.json')"
      ),
    output: z
      .string()
      .describe(
        "The output file path for generated icon components (e.g., './src/icons.tsx')"
      ),
    framework: frameworkSchema.describe(
      "The framework to generate icon components for"
    ),
    typescript: z
      .boolean()
      .default(true)
      .describe("Whether to generate TypeScript code"),
    a11y: a11ySchema
      .optional()
      .describe(
        "Accessibility strategy for SVG icons (hidden: aria-hidden, img: role=img with aria-label, title: <title> element, presentation: role=presentation, false: no a11y attrs)"
      ),
    hooks: z
      .object({
        preAdd: z
          .array(z.string())
          .describe("Scripts to run before adding icons"),
        postAdd: z
          .array(z.string())
          .describe("Scripts to run after adding icons"),
      })
      .partial()
      .optional()
      .describe("Hooks to run at various stages"),
  })
  .meta({
    title: "Denji Configuration Schema",
    description: "Schema for Denji configuration file",
  });

export type Config = z.infer<typeof configSchema>;

export const CONFIG_FILE = "denji.json";
export const CONFIG_SCHEMA_FILE = "configuration_schema.json";
