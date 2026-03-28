# Feedback Loops for AI Agents

AI agents don't get frustrated by repetition. When code fails type checking or
tests, the agent retries. This makes feedback loops extremely powerful.

## Priority Order

1. **TypeScript** — free, catches most errors without running code
2. **Automated tests** — catches logical errors TypeScript misses
3. **Pre-commit hooks** — enforces all checks before every commit
4. **Code quality (linting + formatting)** — auto-fixes style, catches bugs

## 1. TypeScript Type Checking

Add a `type-check` script to `package.json`:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

If using a monorepo with Turborepo:

```json
{
  "scripts": {
    "type-check": "turbo run type-check"
  }
}
```

## 2. Automated Tests

### Unit / Integration Tests

Ask the user which runner they use or prefer:

**Vitest** (recommended for Vite-based projects):

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Jest**:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**Bun** (built-in test runner, zero config):

```json
{
  "scripts": {
    "test": "bun test"
  }
}
```

### E2E Tests (frontend)

**Playwright** (recommended — headless by default, great for CI/AI):

```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

**Cypress**:

```json
{
  "scripts": {
    "test:e2e": "cypress run"
  }
}
```

Focus on integration-style tests that verify behavior through public interfaces.
AI agents can run these repeatedly to validate their changes.

## 3. Pre-Commit Hooks

Pre-commit hooks are the most powerful feedback loop for AI agents — they block
bad commits and the agent gets an error message to self-correct.

Ask the user which tool they use or prefer:

### Option A: Lefthook (recommended — fast, single binary, no dependencies)

Lefthook is a fast Git hooks manager written in Go. Unlike Husky + lint-staged
(two tools), Lefthook handles both hook management and staged file filtering in
a single tool via `lefthook.yml`.

#### Install

```bash
npm install --save-dev lefthook
npx lefthook install
```

#### Configure `lefthook.yml`

```yaml
pre-commit:
  parallel: true
  jobs:
    - name: lint
      run: npx oxlint --fix {staged_files}
      glob: "*.{ts,tsx,js,jsx}"
      stage_fixed: true

    - name: format
      run: npx oxfmt {staged_files}
      glob: "*.{ts,tsx,js,jsx,json,css}"
      stage_fixed: true

    - name: type-check
      run: npm run type-check

    - name: test
      run: npm run test
```

Key features:
- `{staged_files}` — built-in staged file interpolation (no lint-staged needed)
- `stage_fixed` — re-stages files after auto-fix
- `parallel: true` — runs independent jobs concurrently
- `glob` — filters files per job

### Option B: Husky + lint-staged

Two tools: Husky manages Git hooks, lint-staged runs commands on staged files.

#### Install

```bash
npm install --save-dev husky lint-staged
npx husky init
```

#### Configure `.husky/pre-commit`

```bash
npx lint-staged
npm run type-check
npm run test
```

#### Configure `.lintstagedrc`

```json
{
  "*.{ts,tsx,js,jsx}": ["oxlint --fix", "oxfmt --write"],
  "*": "oxfmt --write --no-error-on-unmatched-pattern"
}
```

Adjust commands to match the project's package manager and linter/formatter.

## 4. Code Quality (Linting + Formatting)

Ask the user which toolchain they use or prefer:

### Option A: Oxlint + Oxfmt (recommended — fastest, Rust-based)

Oxlint is a high-performance linter and Oxfmt is a high-performance formatter,
both from the Oxc project. Written in Rust, they are significantly faster than
JavaScript-based alternatives.

#### Install

```bash
npm install --save-dev oxlint oxfmt
```

#### Initialize configs

```bash
npx oxlint --init    # creates .oxlintrc.json
npx oxfmt --init     # creates .oxfmtrc.json
```

#### Scripts

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check"
  }
}
```

Oxfmt supports `--migrate prettier` and `--migrate biome` to migrate existing
formatter config.

### Option B: Biome (fast, single tool for lint + format)

```bash
npm install --save-dev @biomejs/biome
npx biome init
```

```json
{
  "scripts": {
    "lint": "biome check",
    "lint:fix": "biome check --write"
  }
}
```

### Option C: ESLint + Prettier (most mature ecosystem)

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "fmt": "prettier --write .",
    "fmt:check": "prettier --check ."
  }
}
```

## The Complete Stack

When all four layers work together:

1. AI writes code
2. AI runs `type-check` — catches type errors
3. AI runs `test` — catches logic errors
4. AI commits — pre-commit hook runs lint + format + type-check + tests
5. If anything fails, AI sees error and retries

The agent self-corrects without human intervention. This is what makes AFK
coding (like Ralph) possible.
