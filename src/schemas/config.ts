import { z } from "zod";

export const frameworkSchema = z.enum(["react"]);
export type Framework = z.infer<typeof frameworkSchema>;

export const configSchema = z.object({
  output: z.string(),
  framework: frameworkSchema,
  typescript: z.boolean().default(true),
});

export type Config = z.infer<typeof configSchema>;

export const CONFIG_FILE = "denji.json";
