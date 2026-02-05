# Denji Development Guidelines

## Quality Gates (MANDATORY)

Before ANY commit:
1. `bun run lint:fix` passes
2. `bun run type-check` passes
3. `CLAUDECODE=1 bun test` passes

lefthook pre-commit hooks enforce this.

## Stack

- Runtime: Bun
- Language: TypeScript (strict)
- Linter: Biome
- Git hooks: lefthook
- Commits: Conventional Commits (commitlint)

## Monorepo Structure

```
apps/
  cli/       # Denji CLI → see apps/cli/README.md
  docs/      # Documentation site
```

## Documentation

Detailed docs in `README.md` files per app/package.

## Dependencies

Check `package.json` root and `workspaces.catalog` before adding deps.
Use `bun add` to install.
