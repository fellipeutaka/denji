import {
  _default,
  boolean,
  describe,
  type infer as Infer,
  object,
} from "zod/mini";

export const preactOptionsSchema = object({
  forwardRef: _default(boolean(), false).check(
    describe("Wrap icon components with forwardRef")
  ),
}).check(describe("Preact-specific configuration options"));

export type PreactOptions = Infer<typeof preactOptionsSchema>;
