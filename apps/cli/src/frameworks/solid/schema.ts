import { describe, type infer as Infer, object } from "zod/mini";

// Solid doesn't need forwardRef option - refs work natively as props
export const solidOptionsSchema = object({}).check(
  describe("Solid-specific configuration options")
);

export type SolidOptions = Infer<typeof solidOptionsSchema>;
