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
import { svelteOptionsSchema } from "~/frameworks/svelte/schema";
import { vueOptionsSchema } from "~/frameworks/vue/schema";

export const a11ySchema = union([
  zodEnum(["hidden", "img", "title", "presentation"]),
  literal(false),
]).check(
  describe(
    "Accessibility strategy for SVG icons (hidden: aria-hidden, img: role=img with aria-label, title: <title> element, presentation: role=presentation, false: no a11y attrs)"
  )
);
export type A11y = Infer<typeof a11ySchema>;

// Output config
export const outputTypeSchema = zodEnum(["file", "folder"]).check(
  describe(
    "Output type: 'file' for single icons file, 'folder' for one file per icon component"
  )
);
export type OutputType = Infer<typeof outputTypeSchema>;

const outputObjectSchema = object({
  type: outputTypeSchema,
  path: string().check(
    describe("The output path for generated icon components")
  ),
}).check(
  describe(
    "Output configuration for generated icon components (e.g., { type: 'file', path: './src/icons.tsx' })"
  )
);

const outputSchema = union([
  string().check(
    describe(
      "The output file path for generated icon components (e.g., './src/icons.tsx'). Shorthand for { type: 'file', path: '...' }"
    )
  ),
  outputObjectSchema,
]);

export interface OutputConfig {
  type: OutputType;
  path: string;
}

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
  output: outputSchema,
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

// Vue-specific config
const vueConfigSchema = object({
  framework: literal("vue").check(describe("Vue framework")),
  vue: optional(vueOptionsSchema),
});

// Svelte-specific config
const svelteConfigSchema = object({
  framework: literal("svelte").check(describe("Svelte framework")),
  svelte: optional(svelteOptionsSchema),
});

// Framework discriminated union
const frameworkConfigSchema = discriminatedUnion("framework", [
  reactConfigSchema,
  preactConfigSchema,
  solidConfigSchema,
  vueConfigSchema,
  svelteConfigSchema,
]);

// Final config = base + framework-specific
export const configSchema = intersection(
  baseConfigSchema,
  frameworkConfigSchema
)
  .check(meta({ title: "Denji Configuration Schema" }))
  .check(describe("Schema for Denji configuration file"));

// Raw config type from Zod (output may be string or object)
type RawConfig = Infer<typeof configSchema>;

// Distributive Omit preserves discriminated union variants
type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

// Normalized config type (output is always OutputConfig after loadConfig)
export type Config = DistributiveOmit<RawConfig, "output"> & {
  output: OutputConfig;
};

// Export framework schema for validation in init command
export const frameworkSchema = zodEnum([
  "react",
  "preact",
  "solid",
  "vue",
  "svelte",
]);
export type Framework = Infer<typeof frameworkSchema>;

export const FOLDER_ONLY_FRAMEWORKS: ReadonlySet<Framework> = new Set([
  "svelte",
]);

export const CONFIG_FILE = "denji.json";
export const CONFIG_SCHEMA_FILE = "configuration_schema.json";
