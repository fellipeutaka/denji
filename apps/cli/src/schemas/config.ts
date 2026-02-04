import {
  _default,
  array,
  boolean,
  describe,
  discriminatedUnion,
  type infer as Infer,
  intersection,
  literal,
  meta,
  object,
  optional,
  partial,
  string,
  union,
  enum as zodEnum,
} from "zod/mini";
import { preactOptionsSchema } from "~/frameworks/preact/schema";
import { reactOptionsSchema } from "~/frameworks/react/schema";
import { solidOptionsSchema } from "~/frameworks/solid/schema";

export const a11ySchema = union([
  zodEnum(["hidden", "img", "title", "presentation"]),
  literal(false),
]).check(
  describe(
    "Accessibility strategy for SVG icons (hidden: aria-hidden, img: role=img with aria-label, title: <title> element, presentation: role=presentation, false: no a11y attrs)"
  )
);
export type A11y = Infer<typeof a11ySchema>;

// Base config (shared across all frameworks)
const baseConfigSchema = object({
  $schema: _default(
    optional(string()),
    "https://denji-docs.vercel.app/configuration_schema.json"
  ).check(
    describe(
      "The URL of the JSON Schema for this configuration file (e.g., './node_modules/denji/configuration_schema.json')"
    )
  ),
  output: string().check(
    describe(
      "The output file path for generated icon components (e.g., './src/icons.tsx')"
    )
  ),
  typescript: _default(boolean(), true).check(
    describe("Whether to generate TypeScript code")
  ),
  a11y: optional(a11ySchema),
  trackSource: _default(boolean(), true).check(
    describe(
      "Add data-icon attribute with Iconify source name (enables update command, debugging, and identifying icon collections)"
    )
  ),
  hooks: optional(
    partial(
      object({
        preAdd: array(string()).check(
          describe("Scripts to run before adding icons")
        ),
        postAdd: array(string()).check(
          describe("Scripts to run after adding icons")
        ),
        preRemove: array(string()).check(
          describe("Scripts to run before removing icons")
        ),
        postRemove: array(string()).check(
          describe("Scripts to run after removing icons")
        ),
        preClear: array(string()).check(
          describe("Scripts to run before clearing all icons")
        ),
        postClear: array(string()).check(
          describe("Scripts to run after clearing all icons")
        ),
        preList: array(string()).check(
          describe("Scripts to run before listing icons")
        ),
        postList: array(string()).check(
          describe("Scripts to run after listing icons")
        ),
      })
    )
  ).check(describe("Hooks to run at various stages")),
});

// React-specific config
const reactConfigSchema = object({
  framework: literal("react").check(describe("React framework")),
  react: optional(reactOptionsSchema),
});

// Preact-specific config
const preactConfigSchema = object({
  framework: literal("preact").check(describe("Preact framework")),
  preact: optional(preactOptionsSchema),
});

// Solid-specific config
const solidConfigSchema = object({
  framework: literal("solid").check(describe("Solid framework")),
  solid: optional(solidOptionsSchema),
});

// Framework discriminated union
const frameworkConfigSchema = discriminatedUnion("framework", [
  reactConfigSchema,
  preactConfigSchema,
  solidConfigSchema,
]);

// Final config = base + framework-specific
export const configSchema = intersection(
  baseConfigSchema,
  frameworkConfigSchema
)
  .check(meta({ title: "Denji Configuration Schema" }))
  .check(describe("Schema for Denji configuration file"));

export type Config = Infer<typeof configSchema>;

// Export framework schema for validation in init command
export const frameworkSchema = zodEnum(["react", "preact", "solid"]);
export type Framework = Infer<typeof frameworkSchema>;

export const CONFIG_FILE = "denji.json";
export const CONFIG_SCHEMA_FILE = "configuration_schema.json";
