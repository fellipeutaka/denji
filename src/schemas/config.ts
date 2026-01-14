import { z } from "zod";

export const frameworkSchema = z.enum(["react"]);
export type Framework = z.infer<typeof frameworkSchema>;

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
  })
  .meta({
    title: "Denji Configuration Schema",
    description: "Schema for Denji configuration file",
  });

export type Config = z.infer<typeof configSchema>;

export const CONFIG_FILE = "denji.json";
export const CONFIG_SCHEMA_FILE = "configuration_schema.json";
