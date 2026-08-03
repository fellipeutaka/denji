import type { ResultType } from "~/utils/result";
import type {
  GeneratedIcon,
  MutationReport,
  OutputTargetError,
  StoredIcon,
} from "./types";

/**
 * Collection-shaped persistence boundary for a configured Output Target.
 * Implementations own persistence and remain silent; commands own orchestration
 * and user-facing behavior.
 *
 * `init` owns creation of the configured output path and its initial artifacts.
 * These operations must report missing or wrong-kind paths instead of creating,
 * replacing, or repairing them implicitly.
 */
export interface OutputTarget {
  clear(): Promise<ResultType<MutationReport, OutputTargetError>>;
  list(): Promise<ResultType<readonly StoredIcon[], OutputTargetError>>;
  remove(
    names: readonly string[]
  ): Promise<ResultType<MutationReport, OutputTargetError>>;
  upsert(
    icons: readonly GeneratedIcon[]
  ): Promise<ResultType<MutationReport, OutputTargetError>>;
}
