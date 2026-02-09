import { describe, type infer as Infer, object } from "zod/mini";

// Qwik doesn't need extra options - component$() and PropsOf are standard
export const qwikOptionsSchema = object({}).check(
  describe("Qwik-specific configuration options")
);

export type QwikOptions = Infer<typeof qwikOptionsSchema>;
