import { describe, expect, it } from "bun:test";
import {
  createMutationReport,
  createOutputTargetError,
  summarizeMutationReport,
} from "./types";

describe("Output Target result values", () => {
  it("uses stable error codes with contextual details", () => {
    expect(
      createOutputTargetError("not-initialized", {
        operation: "list",
        path: "/project/icons.tsx",
      })
    ).toEqual({
      code: "not-initialized",
      details: {
        operation: "list",
        path: "/project/icons.tsx",
      },
    });
  });

  it("preserves ordered per-name outcomes and derives counts", () => {
    const report = createMutationReport("upsert", [
      { name: "Check", status: "written" },
      { name: "Home", status: "replaced" },
      {
        error: createOutputTargetError("write-failure", { name: "Search" }),
        name: "Search",
        status: "failed",
      },
    ]);

    expect(report.outcomes.map(({ name }) => name)).toEqual([
      "Check",
      "Home",
      "Search",
    ]);
    expect(summarizeMutationReport(report)).toEqual({
      failed: 1,
      missing: 0,
      removed: 0,
      replaced: 1,
      written: 1,
    });
  });

  it("can carry a target-wide failure alongside partial outcomes", () => {
    const report = createMutationReport(
      "remove",
      [{ name: "Home", status: "removed" }],
      createOutputTargetError("derived-state-failure", {
        path: "/project/icons/index.ts",
      })
    );

    expect(report.targetError?.code).toBe("derived-state-failure");
    expect(report.outcomes).toEqual([{ name: "Home", status: "removed" }]);
  });
});
