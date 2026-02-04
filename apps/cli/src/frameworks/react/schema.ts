import { z } from "zod";

export const reactOptionsSchema = z
  .object({
    forwardRef: z
      .boolean()
      .default(false)
      .describe("Wrap icon components with forwardRef"),
  })
  .describe("React-specific configuration options");

export type ReactOptions = z.infer<typeof reactOptionsSchema>;
