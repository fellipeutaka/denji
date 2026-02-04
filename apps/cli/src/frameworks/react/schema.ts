import {
  _default,
  boolean,
  describe,
  type infer as Infer,
  object,
} from "zod/mini";

export const reactOptionsSchema = object({
  forwardRef: _default(boolean(), false).check(
    describe("Wrap icon components with forwardRef")
  ),
}).check(describe("React-specific configuration options"));

export type ReactOptions = Infer<typeof reactOptionsSchema>;
