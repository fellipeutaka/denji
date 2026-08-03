import type { OutputType } from "~/schemas/config";

/**
 * An icon that has been rendered for persistence at an Output Target.
 * Component names are the identity key; source is optional metadata only.
 */
export interface GeneratedIcon {
  readonly content: string;
  readonly name: string;
  readonly source?: string;
}

/**
 * An icon currently represented by an Output Target.
 * A target may not be able to recover source metadata, especially in folder mode.
 */
export interface StoredIcon {
  readonly name: string;
  readonly source?: string;
}

export const OUTPUT_TARGET_ERROR_CODES = {
  DERIVED_STATE_FAILURE: "derived-state-failure",
  INVALID_REQUEST: "invalid-request",
  INVALID_TARGET: "invalid-target",
  NOT_INITIALIZED: "not-initialized",
  PARSE_FAILURE: "parse-failure",
  READ_FAILURE: "read-failure",
  WRITE_FAILURE: "write-failure",
} as const;

export type OutputTargetErrorCode =
  (typeof OUTPUT_TARGET_ERROR_CODES)[keyof typeof OUTPUT_TARGET_ERROR_CODES];

export type OutputTargetErrorCategory = OutputTargetErrorCode;

export type OutputTargetErrorDetails = Readonly<
  Record<string, boolean | number | string>
>;

/**
 * Structured failure returned for an expected target condition.
 * Commands translate `code` and `details` into user-facing messages.
 */
export interface OutputTargetError {
  readonly code: OutputTargetErrorCategory;
  readonly details: OutputTargetErrorDetails;
}

export type OutputTargetErrorFor<Code extends OutputTargetErrorCode> = Omit<
  OutputTargetError,
  "code"
> & {
  readonly code: Code;
};

export type DerivedStateFailure = OutputTargetErrorFor<"derived-state-failure">;

export function createOutputTargetError<Code extends OutputTargetErrorCode>(
  code: Code,
  details: OutputTargetErrorDetails = {}
): OutputTargetErrorFor<Code> {
  return Object.freeze({
    code,
    details: Object.freeze({ ...details }),
  });
}

export type MutationOperation = "clear" | "remove" | "upsert";

export type MutationOutcomeStatus =
  | "failed"
  | "missing"
  | "removed"
  | "replaced"
  | "written";

export type MutationOutcome =
  | {
      readonly name: string;
      readonly status: "failed";
      readonly error: OutputTargetError;
    }
  | {
      readonly name: string;
      readonly status: Exclude<MutationOutcomeStatus, "failed">;
    };

export interface MutationReport {
  readonly operation: MutationOperation;
  readonly outcomes: readonly MutationOutcome[];
  /**
   * A derived-state failure can coexist with successful component outcomes.
   * Target-wide failures that prevent meaningful processing are returned by the
   * OutputTarget operation as an `Err` instead.
   */
  readonly targetError?: DerivedStateFailure;
}

export interface MutationCounts {
  readonly failed: number;
  readonly missing: number;
  readonly removed: number;
  readonly replaced: number;
  readonly written: number;
}

export function createMutationReport(
  operation: MutationOperation,
  outcomes: readonly MutationOutcome[],
  targetError?: DerivedStateFailure
): MutationReport {
  const frozenOutcomes = outcomes.map((outcome) =>
    Object.freeze({ ...outcome })
  );

  return Object.freeze({
    operation,
    outcomes: Object.freeze(frozenOutcomes),
    ...(targetError ? { targetError } : {}),
  });
}

export function summarizeMutationReport(
  report: Pick<MutationReport, "outcomes">
): MutationCounts {
  const counts: Record<MutationOutcomeStatus, number> = {
    failed: 0,
    missing: 0,
    removed: 0,
    replaced: 0,
    written: 0,
  };

  for (const outcome of report.outcomes) {
    counts[outcome.status]++;
  }

  return Object.freeze(counts);
}

export interface OutputTargetDescriptor {
  /** The already-resolved framework persistence policy. */
  readonly layout: import("./layout").OutputLayout;
  /** The already-resolved output path, normally absolute. */
  readonly path: string;
  /** The configured representation selected by the resolved configuration. */
  readonly type: OutputType;
}

/** Alias used by callers that want to emphasize that resolution happened upstream. */
export type ResolvedOutputTargetDescriptor = OutputTargetDescriptor;
