import type { GeneratedIcon } from "./types";

export type ManagedEntryCandidate = GeneratedIcon;

export interface BarrelPolicy {
  readonly emptyContent: string;
  readonly extension: string;
  /** Base file name, without `extension`. */
  readonly fileName: string;
  readonly render: (names: readonly string[]) => string;
}

export interface TypesFilePolicy {
  readonly content: string;
  readonly fileName: string;
}

/**
 * Immutable framework-specific persistence policy shared by file and folder
 * adapters. It describes syntax and derived artifacts; it does not transform
 * icons or perform filesystem operations.
 */
export interface OutputLayout {
  /** Folder barrel policy, when the selected framework uses a derived barrel. */
  readonly barrel?: BarrelPolicy;
  /** Extension used by generated component files and aggregate files. */
  readonly componentExtension: string;
  /** Empty aggregate-file content used by file targets and clear/reset. */
  readonly emptyFileContent: string;
  /** Recognizes a Denji-managed aggregate entry without assuming every export is managed. */
  readonly isManagedEntry: (entry: ManagedEntryCandidate) => boolean;
  /** Optional framework helper file that init creates and mutations preserve. */
  readonly typesFile?: TypesFilePolicy;
}

/**
 * Resolves a layout once at the framework/configuration seam and freezes it so
 * targets cannot mutate shared policy between command invocations.
 */
export function createOutputLayout(layout: OutputLayout): OutputLayout {
  const barrel = layout.barrel
    ? Object.freeze({
        emptyContent: layout.barrel.emptyContent,
        extension: layout.barrel.extension,
        fileName: layout.barrel.fileName,
        render: layout.barrel.render,
      })
    : undefined;
  const typesFile = layout.typesFile
    ? Object.freeze({
        content: layout.typesFile.content,
        fileName: layout.typesFile.fileName,
      })
    : undefined;

  return Object.freeze({
    componentExtension: layout.componentExtension,
    emptyFileContent: layout.emptyFileContent,
    isManagedEntry: layout.isManagedEntry,
    ...(barrel ? { barrel } : {}),
    ...(typesFile ? { typesFile } : {}),
  });
}
