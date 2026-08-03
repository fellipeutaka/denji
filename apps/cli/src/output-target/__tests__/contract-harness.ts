import { describe, expect, it } from "bun:test";
import type { OutputTarget } from "../contract";
import type { GeneratedIcon } from "../types";

export type OutputTargetFixture = () => OutputTarget | Promise<OutputTarget>;

export interface OutputTargetContractFixtures {
  /** Returns a target that fails Check but continues with Home. */
  createBestEffortTarget?: OutputTargetFixture;
  /** Returns a target whose upsert reports a derived-state failure. */
  createDerivedStateFailureTarget?: OutputTargetFixture;
  createTarget: OutputTargetFixture;
  /** Returns a target whose list operation fails as not initialized. */
  createTargetErrorTarget?: OutputTargetFixture;
}

/**
 * Shared observable contract tests for every OutputTarget adapter.
 *
 * Adapter suites should provide an initialized-target fixture and may provide
 * configured failure fixtures for the target-level and best-effort cases. Each
 * fixture is called for each test so state never leaks between examples.
 */
export function defineOutputTargetContractTests(
  fixtures: OutputTargetContractFixtures
): void {
  const generatedIcons: readonly GeneratedIcon[] = [
    {
      content: "export const Check = () => null;",
      name: "Check",
      source: "lucide:check",
    },
    {
      content: "export const Home = () => null;",
      name: "Home",
      source: "mdi:home",
    },
  ];

  describe("OutputTarget contract", () => {
    it("treats empty batches and empty clear as successful no-ops", async () => {
      const target = await fixtures.createTarget();

      const upsertResult = await target.upsert([]);
      const removeResult = await target.remove([]);
      const clearResult = await target.clear();

      expect(upsertResult.isOk()).toBe(true);
      expect(removeResult.isOk()).toBe(true);
      expect(clearResult.isOk()).toBe(true);
      if (upsertResult.isOk() && removeResult.isOk() && clearResult.isOk()) {
        expect(upsertResult.value).toEqual({
          operation: "upsert",
          outcomes: [],
        });
        expect(removeResult.value).toEqual({
          operation: "remove",
          outcomes: [],
        });
        expect(clearResult.value).toEqual({
          operation: "clear",
          outcomes: [],
        });
      }
    });

    it("returns ordered outcomes for a batch upsert", async () => {
      const target = await fixtures.createTarget();

      const result = await target.upsert(generatedIcons);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.outcomes).toEqual([
          { name: "Check", status: "written" },
          { name: "Home", status: "written" },
        ]);
      }
    });

    it("reports replacement by component name and does not use source as identity", async () => {
      const target = await fixtures.createTarget();
      await target.upsert(generatedIcons);

      const result = await target.upsert([
        {
          content: "export const Check = () => 1;",
          name: "Check",
          source: "different:source",
        },
      ]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.outcomes).toEqual([
          { name: "Check", status: "replaced" },
        ]);
      }
    });

    it("reports present and missing names in remove-request order", async () => {
      const target = await fixtures.createTarget();
      await target.upsert(generatedIcons);

      const result = await target.remove(["Home", "Missing", "Check"]);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.outcomes).toEqual([
          { name: "Home", status: "removed" },
          { name: "Missing", status: "missing" },
          { name: "Check", status: "removed" },
        ]);
      }
    });

    it("rejects duplicate names before mutation", async () => {
      const target = await fixtures.createTarget();
      const firstIcon = generatedIcons[0];
      if (!firstIcon) {
        throw new Error("Contract fixture must define a first icon");
      }

      const upsertResult = await target.upsert([firstIcon, firstIcon]);
      const removeResult = await target.remove(["Check", "Check"]);

      expect(upsertResult.isErr()).toBe(true);
      expect(removeResult.isErr()).toBe(true);
      if (upsertResult.isErr() && removeResult.isErr()) {
        expect(upsertResult.error.code).toBe("invalid-request");
        expect(removeResult.error.code).toBe("invalid-request");
      }

      const listResult = await target.list();
      expect(listResult.isOk()).toBe(true);
      if (listResult.isOk()) {
        expect(listResult.value).toEqual([]);
      }
    });

    it("lists stored icons and reports every name when clearing a collection", async () => {
      const target = await fixtures.createTarget();
      await target.upsert(generatedIcons);

      const listResult = await target.list();
      const clearResult = await target.clear();

      expect(listResult.isOk()).toBe(true);
      expect(clearResult.isOk()).toBe(true);
      if (listResult.isOk() && clearResult.isOk()) {
        expect(listResult.value).toEqual([
          { name: "Check", source: "lucide:check" },
          { name: "Home", source: "mdi:home" },
        ]);
        expect(clearResult.value.outcomes).toEqual([
          { name: "Check", status: "removed" },
          { name: "Home", status: "removed" },
        ]);
      }
    });

    if (fixtures.createBestEffortTarget) {
      it("preserves per-item failures while continuing a best-effort batch", async () => {
        const target = await fixtures.createBestEffortTarget?.();
        if (!target) {
          throw new Error("Best-effort contract fixture is missing");
        }

        const result = await target.upsert(generatedIcons);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.outcomes[0]).toMatchObject({
            name: "Check",
            status: "failed",
          });
          expect(result.value.outcomes[1]).toEqual({
            name: "Home",
            status: "written",
          });
        }
      });
    }

    if (fixtures.createTargetErrorTarget) {
      it("returns a structured target-level failure", async () => {
        const target = await fixtures.createTargetErrorTarget?.();
        if (!target) {
          throw new Error("Target-error contract fixture is missing");
        }

        const result = await target.list();

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe("not-initialized");
        }
      });
    }

    if (fixtures.createDerivedStateFailureTarget) {
      it("separates derived-state failure from successful item outcomes", async () => {
        const target = await fixtures.createDerivedStateFailureTarget?.();

        if (!target) {
          throw new Error("Derived-state contract fixture is missing");
        }

        const result = await target.upsert(generatedIcons);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.outcomes).toEqual([
            { name: "Check", status: "written" },
            { name: "Home", status: "written" },
          ]);
          expect(result.value.targetError?.code).toBe("derived-state-failure");
        }
      });
    }
  });
}
