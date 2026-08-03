import { Err, Ok } from "~/utils/result";
import type { OutputTarget } from "../contract";
import {
  createMutationReport,
  createOutputTargetError,
  type GeneratedIcon,
  type MutationReport,
  type OutputTargetError,
  type StoredIcon,
} from "../types";
import { defineOutputTargetContractTests } from "./contract-harness";

interface InMemoryTargetOptions {
  derivedStateFailure?: boolean;
  failName?: string;
  targetError?: OutputTargetError;
}

function createInMemoryTarget(
  options: InMemoryTargetOptions = {}
): OutputTarget {
  const stored = new Map<string, StoredIcon>();

  function duplicateNameError(name: string): OutputTargetError {
    return createOutputTargetError("invalid-request", {
      name,
      reason: "duplicate-name",
    });
  }

  function findDuplicate(names: readonly string[]): string | undefined {
    const seen = new Set<string>();
    for (const name of names) {
      if (seen.has(name)) {
        return name;
      }
      seen.add(name);
    }
    return undefined;
  }

  function duplicateResult(
    name: string
  ): Promise<Err<MutationReport, OutputTargetError>> {
    return Promise.resolve(new Err(duplicateNameError(name)));
  }

  return {
    clear: () => {
      const outcomes = [...stored.keys()].map((name) => ({
        name,
        status: "removed" as const,
      }));
      stored.clear();
      return Promise.resolve(new Ok(createMutationReport("clear", outcomes)));
    },
    list: () =>
      options.targetError
        ? Promise.resolve(new Err(options.targetError))
        : Promise.resolve(new Ok([...stored.values()])),
    remove: (names) => {
      const duplicate = findDuplicate(names);
      if (duplicate) {
        return duplicateResult(duplicate);
      }

      const outcomes = names.map((name) => {
        if (!stored.delete(name)) {
          return { name, status: "missing" as const };
        }
        return { name, status: "removed" as const };
      });
      return Promise.resolve(new Ok(createMutationReport("remove", outcomes)));
    },
    upsert: (icons: readonly GeneratedIcon[]) => {
      const duplicate = findDuplicate(icons.map(({ name }) => name));
      if (duplicate) {
        return duplicateResult(duplicate);
      }

      const outcomes = icons.map((icon) => {
        if (icon.name === options.failName) {
          return {
            error: createOutputTargetError("write-failure", {
              name: icon.name,
            }),
            name: icon.name,
            status: "failed" as const,
          };
        }

        if (stored.has(icon.name)) {
          stored.set(icon.name, { name: icon.name, source: icon.source });
          return { name: icon.name, status: "replaced" as const };
        }

        stored.set(icon.name, { name: icon.name, source: icon.source });
        return { name: icon.name, status: "written" as const };
      });
      const targetError = options.derivedStateFailure
        ? createOutputTargetError("derived-state-failure", {
            path: "/project/icons/index.ts",
          })
        : undefined;
      return Promise.resolve(
        new Ok(createMutationReport("upsert", outcomes, targetError))
      );
    },
  };
}

defineOutputTargetContractTests({
  createBestEffortTarget: () => createInMemoryTarget({ failName: "Check" }),
  createDerivedStateFailureTarget: () =>
    createInMemoryTarget({ derivedStateFailure: true }),
  createTarget: createInMemoryTarget,
  createTargetErrorTarget: () =>
    createInMemoryTarget({
      targetError: createOutputTargetError("not-initialized", {
        operation: "list",
        path: "/project/icons",
      }),
    }),
});
