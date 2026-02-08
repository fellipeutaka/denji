import { describe, type infer as Infer, object } from "zod/mini";

export const svelteOptionsSchema = object({}).check(
  describe("Svelte-specific configuration options")
);

export type SvelteOptions = Infer<typeof svelteOptionsSchema>;
