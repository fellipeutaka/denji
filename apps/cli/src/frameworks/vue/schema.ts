import {
  _default,
  describe,
  type infer as Infer,
  object,
  enum as zodEnum,
} from "zod/mini";

export const vueOptionsSchema = object({
  syntax: _default(zodEnum(["h"]), "h").check(
    describe(
      "Component syntax: 'h' for render function (future: 'sfc' for .vue files)"
    )
  ),
}).check(describe("Vue-specific configuration options"));

export type VueOptions = Infer<typeof vueOptionsSchema>;
