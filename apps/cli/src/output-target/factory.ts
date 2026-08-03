import { Err, Ok, type ResultType } from "~/utils/result";
import type { OutputTarget } from "./contract";
import type { OutputLayout } from "./layout";
import type {
  OutputTargetDescriptor,
  OutputTargetError,
  OutputTargetErrorDetails,
} from "./types";
import { createOutputTargetError } from "./types";

export interface OutputTargetCreators {
  /** Create a new file target for every call. */
  readonly file: (descriptor: OutputTargetDescriptor) => OutputTarget;
  /** Create a new folder target for every call. */
  readonly folder: (descriptor: OutputTargetDescriptor) => OutputTarget;
}

export interface OutputTargetFactory {
  createTarget(
    descriptor: OutputTargetDescriptor
  ): ResultType<OutputTarget, OutputTargetError>;
}

function invalidDescriptor(field: string, reason: string): OutputTargetError {
  const details: OutputTargetErrorDetails = { field, reason };
  return createOutputTargetError("invalid-request", details);
}

function isOutputLayout(value: unknown): value is OutputLayout {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const layout = value as Partial<OutputLayout>;
  const barrel = layout.barrel;
  const typesFile = layout.typesFile;

  const hasValidBarrel =
    barrel === undefined ||
    (typeof barrel === "object" &&
      barrel !== null &&
      typeof barrel.emptyContent === "string" &&
      typeof barrel.extension === "string" &&
      typeof barrel.fileName === "string" &&
      typeof barrel.render === "function");
  const hasValidTypesFile =
    typesFile === undefined ||
    (typeof typesFile === "object" &&
      typesFile !== null &&
      typeof typesFile.content === "string" &&
      typeof typesFile.fileName === "string");

  return (
    typeof layout.componentExtension === "string" &&
    typeof layout.emptyFileContent === "string" &&
    typeof layout.isManagedEntry === "function" &&
    hasValidBarrel &&
    hasValidTypesFile
  );
}

function validateDescriptor(
  descriptor: unknown
): OutputTargetError | undefined {
  if (typeof descriptor !== "object" || descriptor === null) {
    return invalidDescriptor("descriptor", "invalid");
  }

  const candidate = descriptor as Partial<OutputTargetDescriptor>;
  if (typeof candidate.path !== "string" || candidate.path.trim() === "") {
    return invalidDescriptor("path", "empty");
  }

  if (candidate.type !== "file" && candidate.type !== "folder") {
    return invalidDescriptor("type", "unsupported");
  }

  if (!isOutputLayout(candidate.layout)) {
    return invalidDescriptor("layout", "invalid");
  }

  return undefined;
}

export function createOutputTargetFactory(
  creators: OutputTargetCreators
): OutputTargetFactory {
  return {
    createTarget(descriptor) {
      const validationError = validateDescriptor(descriptor);
      if (validationError) {
        return new Err(validationError);
      }

      const resolvedDescriptor = Object.freeze({ ...descriptor });
      const target = creators[resolvedDescriptor.type](resolvedDescriptor);
      return new Ok(target);
    },
  };
}
