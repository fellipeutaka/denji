# Output Target persistence seam

## Problem Statement

Denji currently maintains file and folder icon collections through separate command-mode runners. The commands repeatedly inspect the configured output type, select a file or folder runner, and pass broad command dependencies into that runner. This couples command orchestration to persistence representation and makes the same behavior difficult to keep consistent across `add`, `list`, `clear`, `remove`, and `export`.

The current split also leaves persistence concerns without one stable contract. File output parses and edits one aggregate source file, while folder output writes component files and regenerates a barrel. Expected conditions such as a missing output, a wrong path kind, or malformed aggregate source are not represented consistently at the boundary. Folder mutations can affect several files, but their partial-success behavior is not expressed as a shared result.

The architecture needs one deep module for output persistence while preserving the established CLI contract: flags, prompts, hooks, dry-run behavior, framework layouts, logging, and export manifest behavior must remain unchanged.

## Solution

Introduce an `OutputTarget` abstraction and one `OutputTargetFactory` as the output-persistence seam.

After configuration, framework, and layout resolution, each affected command asks the factory for a fresh target using a narrow target descriptor. The descriptor identifies the configured output representation and the already-resolved `OutputLayout`; it does not expose the full configuration object or framework strategy.

The target surface is collection-shaped:

- `list` returns `Stored Icon` values.
- Batch `upsert` accepts `Generated Icon` values and returns a mutation report.
- Batch `remove` accepts component names and returns a mutation report.
- Parameterless `clear` resets the managed collection and returns a mutation report.

Keep separate `FileOutputTarget` and `FolderOutputTarget` implementations behind that contract. The file target owns aggregate-file parsing, managed-entry replacement/removal, and aggregate persistence. The folder target owns component-file persistence, managed-file discovery, and barrel regeneration. Both adapters return structured results, never log, and never create output implicitly.

Commands remain responsible for icon intake, fetching, validation, framework transformation, prompts, hooks, user-facing logs, dry-run decisions, and export manifest construction/serialization. `import` remains upstream of `AddCommand`; it does not use the target directly. `init` remains the lifecycle owner for creating the output path and its initial artifacts.

## User Stories

1. As a Denji user, I want `add` to persist generated icons through one output contract, so that file and folder outputs have the same command behavior.
2. As a Denji user, I want to add icons to an aggregate file, so that existing file-based projects continue to work.
3. As a Denji user, I want to add icons to a folder output, so that each generated icon remains an independently addressable component file.
4. As a Denji user, I want existing component names to be replaced only after the command's existing overwrite confirmation, so that accidental replacement remains guarded by the current prompt behavior.
5. As a Denji user, I want component names to remain the uniqueness key, so that the same name cannot represent two stored icons in one Output Target.
6. As a Denji user, I want source identity to remain optional metadata, so that missing or disabled `data-icon` tracking does not prevent persistence.
7. As a Denji user, I want `list` to work against either output representation without exposing representation-specific command branches, so that the CLI remains consistent as output strategies evolve.
8. As a Denji user, I want file listing to retain the current source metadata behavior, so that tracked `data-icon` values continue to appear where they are currently available.
9. As a Denji user, I want folder listing to use configured component filenames, so that folder behavior does not depend on parsing component contents for source metadata.
10. As a Denji user, I want `clear` to remove all managed icons from a file target, so that the aggregate output returns to its configured empty template.
11. As a Denji user, I want `clear` to remove all managed component files and regenerate an empty barrel for a folder target, so that the folder collection is reset without deleting unrelated files.
12. As a Denji user, I want clearing an already-empty target to be a successful no-op, so that reset commands do not perform unnecessary writes.
13. As a Denji user, I want `remove` to remove several component names in one operation, so that cleanup does not require one command invocation per icon.
14. As a Denji user, I want removing a missing name to be reported while present names are still removed, so that one stale name does not prevent useful cleanup.
15. As a Denji user, I want empty batch add/remove requests to complete without filesystem mutation, so that callers can safely pass an empty collection.
16. As a Denji user, I want `export` to obtain stored icons through the same target seam, so that file and folder exports remain consistent.
17. As a Denji user, I want export manifest construction, serialization, stdout, and manifest-file output to remain in the export command, so that this architecture change does not alter export formats or destinations.
18. As a Denji user, I want `import` to keep delegating to `add`, so that imported manifests receive the same validation, prompting, hooks, transformation, and dry-run behavior as direct additions.
19. As a Denji user, I want dry-run to inspect the target and show the existing preview messages without writing, so that I can review changes safely.
20. As a Denji user, I want dry-run decisions to remain in commands, so that target adapters do not need to understand CLI preview policy.
21. As a Denji user, I want pre- and post-operation hooks to run in their current command-controlled order, so that existing automation keeps working.
22. As a Denji user, I want target adapters to remain silent, so that all user-facing output continues to use the CLI's existing log and prompt behavior.
23. As a Denji user, I want a missing output path to produce a clear structured not-initialized error, so that I know to run `init` instead of having a command silently create files.
24. As a Denji user, I want a file target pointing at a directory, or a folder target pointing at a regular file, to fail safely, so that Denji never coerces or replaces an incorrectly configured path.
25. As a Denji user, I want malformed aggregate output to fail closed without modification, so that an invalid source file is not silently treated as an empty collection.
26. As a Denji user, I want individual file writes to avoid partial-write corruption, so that a failed persistence operation leaves the prior file content intact where the platform permits atomic replacement.
27. As a Denji user, I want unrelated aggregate-file content to survive individual icon upserts and removals, so that Denji does not overwrite user-authored exports or imports it does not manage.
28. As a Denji user, I want unrecognized files in a folder output to remain untouched, so that Denji manages only configured icon component files and its own derived files.
29. As a Denji user, I want regenerated folder barrels to have stable ordering, so that repeated operations produce predictable output and small diffs.
30. As a Denji user, I want a folder mutation that partially succeeds to report exactly what changed and what failed, so that I can recover from a multi-file error.
31. As a Denji user, I want component-file successes to remain visible if barrel regeneration fails, so that the result reflects the actual best-effort state rather than claiming an unsupported rollback.
32. As a Denji user, I want errors to retain stable machine-readable categories, so that commands can translate adapter failures into the established messages without depending on filesystem exception text.
33. As a Denji user, I want mutation reports to preserve request order and identify each requested name's outcome, so that command output and diagnostics remain precise.
34. As a Denji user, I want `init` to create the complete initial Output Target, including the aggregate file or folder artifacts, so that subsequent target operations have an explicit lifecycle boundary.
35. As a Denji user, I want targets never to create missing output implicitly, so that a typo or missing initialization cannot create an unexpected collection.
36. As a Denji user, I want repeated initialization to be non-destructive, so that existing output is not silently reset or overwritten.
37. As a Denji user, I want framework-specific layout rules to remain correct for every supported framework, so that the new seam does not change extensions, empty templates, component content, or barrel policy.
38. As a maintainer, I want one injected factory dependency for output persistence, so that command tests can replace the entire persistence boundary without mocking every file and folder branch.
39. As a maintainer, I want shared contract tests for both adapters, so that future output representations must satisfy the same observable semantics.
40. As a maintainer, I want adapter-specific tests for aggregate syntax and folder layout, so that representation-specific rules remain explicit without leaking into command tests.

## Implementation Decisions

- Define `OutputTarget` as the single persistence abstraction for `add`, `list`, `clear`, `remove`, and `export`.
- Create one `OutputTargetFactory` that commands call after config, framework, and layout resolution. Commands must not branch on the configured output type or receive paired file/folder runner callbacks.
- Construct a fresh target per command invocation. Do not use a singleton target or share mutable target state between commands.
- Pass a narrow descriptor to the factory. It should contain the resolved output representation/path and the resolved `OutputLayout`, not the full `Config` or `FrameworkStrategy`.
- Keep `FileOutputTarget` and `FolderOutputTarget` as separate implementations behind the common interface.
- Keep the public operations collection-shaped: list, batch upsert, batch remove, and parameterless clear. Do not expose raw filesystem methods or command-shaped runners through the target contract.
- Use `Generated Icon` as the write-side value. It contains a component name, rendered component content, and optional source identity.
- Use `Stored Icon` as the read-side value. It contains a component name and optional source identity.
- Treat component name as the uniqueness key. Source identity is metadata and must not determine identity or overwrite behavior.
- Resolve framework-specific persistence policy through a small immutable `OutputLayout` abstraction. It supplies the relevant extensions, empty-file content, barrel policy, and narrow syntax/managed-entry recognition needed by the adapters. Targets store supplied content and do not generate framework syntax.
- Keep `init` outside the target seam. It creates the configured output path and complete initial artifacts, including the file template or folder structure, barrel, and optional types file.
- Do not let a target create a missing path, parent directory, aggregate file, component file, barrel, or other initialization artifact implicitly. A missing or incomplete target is reported as a structured not-initialized error.
- Keep initialization non-destructive when the configured target already exists. Existing output must not be silently recreated, reset, or replaced.
- Let factory construction validate the descriptor only. Target operations perform operation-specific existence, path-kind, readability, parse, and initialization checks and return structured results.
- Return explicit result values for expected target failures rather than throwing. Expected failures include not-initialized, invalid-target, read failure, parse failure, write failure, and invalid request. Unexpected programming or system failures may still surface as exceptions.
- Use stable machine-readable error codes with contextual details. Commands translate these codes into the existing user-facing messages and do not expose adapter-specific exception strings as their contract.
- Treat a configured file path that resolves to a directory, or a configured folder path that resolves to a regular file, as invalid-target. Never coerce, replace, or delete the wrong-kind path.
- Make malformed aggregate-file output fail closed and non-destructive. Do not treat a parse failure as an empty collection.
- Make batch mutations explicitly best-effort. Per-item outcomes belong in the mutation report; target-wide failures that prevent meaningful processing are returned as structured target-level errors.
- Preserve the input order in mutation reports and provide a per-name outcome such as written, replaced, removed, missing, or failed. Aggregate counts may be derived for command messaging.
- Require unique component names within a batch. Duplicate names are an invalid request and must be resolved before mutation; no ambiguous last-write-wins behavior is part of the target contract.
- Treat empty upsert and remove batches as successful non-mutating no-ops. Treat empty clear as a successful non-mutating no-op as well.
- Have each batch load and plan the relevant target state once. File batches should parse and plan the aggregate once; folder batches should plan component-file and barrel changes once before applying writes.
- Perform individual file writes atomically where practical, such as through temporary-file replacement, so a failed write does not leave a partially written existing file. Do not promise cross-file transactions or rollback for folder operations.
- When a folder mutation writes component files successfully but barrel regeneration fails, preserve the component successes in the mutation report and surface the derived-state failure separately. Do not roll back the component files.
- Make folder component files the source of truth and the barrel derived state. Mutations regenerate the barrel using deterministic component-name ordering.
- Preserve unrecognized folder files. Recognize only configured icon component files and Denji-derived files such as the barrel and optional types file.
- For folder reads and exports, derive names from recognized filenames and leave `Stored Icon.source` undefined, preserving current behavior without parsing component contents for `data-icon`.
- For file persistence, recognize Denji-managed entries through the existing generated marker/layout, such as `data-icon`, and use component name to match recognized entries. Do not claim arbitrary same-named user exports as managed icons solely because of their name.
- For individual file upserts and removals, preserve unrelated imports, exports, and user-authored content. The explicit clear/reset path may restore the configured empty aggregate template as currently specified.
- Keep overwrite confirmation in the command. The target receives the generated batch only after command-level prompt policy has been applied.
- Keep icon intake, validation, fetching, framework transformation, prompts, hooks, dry-run messaging, logging, and export manifest construction/serialization in commands or their existing upstream services.
- Keep dry-run at command level. Commands inspect/list and log previews, then skip mutating target methods. Targets do not receive a dry-run flag.
- Keep `import` upstream of `AddCommand`; it must not acquire a separate target dependency or bypass add orchestration.
- Preserve existing CLI flags, messages, layouts, hook order, prompt behavior, dry-run output, and export manifest behavior. Replacing runner dispatch tests with factory/target behavior tests is expected, but user-visible behavior is not.
- Consider recording this seam in an ADR after implementation because it is architectural, has meaningful alternatives, and may otherwise surprise future maintainers. This spec does not require the ADR as part of implementation unless the maintainer chooses to add it.

## Testing Decisions

- Test observable behavior at the highest stable seam. Prefer the public `OutputTarget` contract and command behavior over private helper implementation details or the choice of parser/write helper.
- Add shared contract tests that run against both `FileOutputTarget` and `FolderOutputTarget`. Cover list, batch upsert, batch remove, clear, empty operations, duplicate-name validation, structured errors, per-item reports, best-effort behavior, and target-level failures.
- Add file-adapter tests for aggregate-file parsing, managed-entry recognition, insertion, replacement, removal, preservation of unrelated content, source metadata extraction, malformed-source fail-closed behavior, wrong path kinds, missing initialization, deterministic batch planning, and atomic-write failure behavior where the filesystem seam can observe it.
- Add folder-adapter tests for recognized component filenames, preservation of unrecognized files, component upsert/removal, barrel regeneration, deterministic barrel ordering, empty barrel reset, optional types-file preservation, missing or invalid target artifacts, partial component/barrel failure, and undefined folder source metadata.
- Add `OutputLayout` tests for extensions, empty-file content, barrel policy, and managed-entry recognition across supported framework layouts. Verify that targets persist supplied rendered content rather than generating framework syntax themselves.
- Update dependency and default-service tests to cover one factory seam and fresh target creation rather than paired mode-runner dispatch.
- Keep command tests focused on orchestration: context/config/framework resolution, factory invocation, icon intake and transformation, overwrite prompts, hook order, dry-run skipping, user-facing logs, structured-error translation, and export manifest behavior.
- Replace brittle tests that assert selection of `runFileMode` or `runFolderMode` with tests that assert the command uses the factory/target contract and preserves externally visible behavior.
- Preserve the existing constructor-injected dependency style and mock factories used by command tests. Do not introduce module-level mocking for the new seam.
- Keep import tests focused on decoding, validation, and delegation to `AddCommand`; do not add direct import-to-target tests.
- Keep `init` tests focused on creation of complete initial artifacts, validation of output representation/extension, non-destructive existing-target behavior, and user-visible errors.
- Add regression coverage for existing CLI messages, display modes, JSON/TOON export and list output, hooks, prompts, and dry-run previews so the architectural refactor cannot silently change the CLI contract.

## Out of Scope

- Adding new CLI commands, flags, output representations, frameworks, or layout formats.
- Changing the existing configuration schema or renaming user-facing output settings.
- Moving icon fetching, validation, framework transformation, prompt handling, hooks, logging, or export serialization into `OutputTarget`.
- Adding a target-level dry-run flag or making target adapters responsible for preview messages.
- Making `import` call `OutputTarget` directly or bypass `AddCommand`.
- Promising cross-file transactions, rollback, journaling, locking, or multi-process coordination.
- Silently creating, repairing, replacing, or deleting a missing or wrong-kind Output Target from ordinary target operations.
- Treating malformed aggregate output as empty or attempting destructive recovery automatically.
- Parsing folder component contents to recover source identity for list/export.
- Changing the export manifest schema or its stdout/file output behavior.
- Reformatting unrelated user-authored aggregate-file content beyond the managed edits required by the operation.
- Creating an ADR as a prerequisite for this implementation.

## Further Notes

- The domain glossary in `CONTEXT.md` is authoritative for `Output Target`, `Generated Icon`, and `Stored Icon`; use those terms in code, tests, and future documentation.
- The current repository has no output-target ADR. The seam is intentionally documented here first so implementation can proceed from shared understanding; an ADR can capture the final decision afterward.
- The worktree contains an untracked `CONTEXT.md` created by the domain-modeling work. It is in scope to preserve and should not be removed or folded into unrelated changes.
- The specification is intended to be implemented incrementally: establish the contract and factory, migrate commands, implement the file adapter, implement the folder adapter, then replace dispatch-focused tests with contract and orchestration coverage.
- The implementation should preserve the current behavior even where the internal dependency graph changes substantially. Any unavoidable message or ordering difference should be treated as a regression requiring explicit review.
