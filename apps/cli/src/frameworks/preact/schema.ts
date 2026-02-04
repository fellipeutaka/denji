import { z } from "zod";

export const preactOptionsSchema = z
  .object({
    forwardRef: z
      .boolean()
      .default(false)
      .describe("Wrap icon components with forwardRef"),
  })
  .describe("Preact-specific configuration options");

export type PreactOptions = z.infer<typeof preactOptionsSchema>;
