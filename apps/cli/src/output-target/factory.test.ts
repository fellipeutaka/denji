import { describe, expect, it, mock } from "bun:test";
import { Ok } from "~/utils/result";
import type { OutputTarget } from "./contract";
import { createOutputTargetFactory } from "./factory";
import { createOutputLayout } from "./layout";
import type { OutputTargetDescriptor } from "./types";

const layout = createOutputLayout({
  componentExtension: ".tsx",
  emptyFileContent: "export const Icons = {} as const;\n",
  isManagedEntry: () => true,
});

function createTarget(): OutputTarget {
  return {
    clear: async () => new Ok({ operation: "clear", outcomes: [] }),
    list: async () => new Ok([]),
    remove: async () => new Ok({ operation: "remove", outcomes: [] }),
    upsert: async () => new Ok({ operation: "upsert", outcomes: [] }),
  };
}

function descriptor(
  type: OutputTargetDescriptor["type"] = "file"
): OutputTargetDescriptor {
  return {
    layout,
    path: `/project/icons${type === "file" ? ".tsx" : ""}`,
    type,
  };
}

describe("OutputTargetFactory", () => {
  it("selects a creator from the resolved target representation", () => {
    const fileCreator = mock((input: OutputTargetDescriptor) => {
      expect(input.type).toBe("file");
      expect(input.path).toBe("/project/icons.tsx");
      expect(input.layout).toBe(layout);
      return createTarget();
    });
    const folderCreator = mock(() => createTarget());
    const factory = createOutputTargetFactory({
      file: fileCreator,
      folder: folderCreator,
    });

    const result = factory.createTarget(descriptor());

    expect(result.isOk()).toBe(true);
    expect(fileCreator).toHaveBeenCalledTimes(1);
    expect(folderCreator).not.toHaveBeenCalled();
  });

  it("selects the folder creator for a folder descriptor", () => {
    const folderCreator = mock((input: OutputTargetDescriptor) => {
      expect(input.type).toBe("folder");
      return createTarget();
    });
    const factory = createOutputTargetFactory({
      file: mock(() => createTarget()),
      folder: folderCreator,
    });

    const result = factory.createTarget(descriptor("folder"));

    expect(result.isOk()).toBe(true);
    expect(folderCreator).toHaveBeenCalledTimes(1);
  });

  it("creates a fresh target for every invocation", () => {
    const factory = createOutputTargetFactory({
      file: () => createTarget(),
      folder: () => createTarget(),
    });

    const first = factory.createTarget(descriptor());
    const second = factory.createTarget(descriptor());

    expect(first.isOk()).toBe(true);
    expect(second.isOk()).toBe(true);
    if (first.isOk() && second.isOk()) {
      expect(first.value).not.toBe(second.value);
    }
  });

  it("returns a structured invalid-request error for an invalid descriptor", () => {
    const factory = createOutputTargetFactory({
      file: mock(() => createTarget()),
      folder: mock(() => createTarget()),
    });

    const result = factory.createTarget({ ...descriptor(), path: "" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({
        code: "invalid-request",
        details: {
          field: "path",
          reason: "empty",
        },
      });
    }
  });

  it("returns a structured invalid-request error for a non-object descriptor", () => {
    const factory = createOutputTargetFactory({
      file: mock(() => createTarget()),
      folder: mock(() => createTarget()),
    });

    const result = factory.createTarget(undefined as never);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toEqual({
        code: "invalid-request",
        details: {
          field: "descriptor",
          reason: "invalid",
        },
      });
    }
  });
});
