# Contributing

Thanks for your interest in contributing to Denji. We're happy to have you here.

Please take a moment to review this document before submitting your first pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

If you need any help, feel free to reach out by opening a [GitHub Discussion](https://github.com/fellipeutaka/denji/discussions).

## About this repository

This repository is a monorepo.

- We use [Bun](https://bun.sh) for package management and development.
- We use [Turborepo](https://turbo.build/repo) as our build system.
- We use [Changesets](https://github.com/changesets/changesets) for managing releases.

## Structure

This repository is structured as follows:

```
apps
├── cli       # Main CLI package
└── docs      # Documentation website
```

| Path        | Description                               |
| ----------- | ----------------------------------------- |
| `apps/cli`  | The main Denji CLI package                |
| `apps/docs` | The documentation website (Next.js)       |

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top right corner of this page.

### Clone on your local machine

```bash
git clone https://github.com/fellipeutaka/denji.git
```

### Navigate to project directory

```bash
cd denji
```

### Create a new Branch

```bash
git checkout -b my-new-branch
```

### Install dependencies

```bash
bun install
```

## Running the CLI Locally

To test the CLI locally:

1. Build the project:

   ```bash
   bun run build
   ```

2. Run the CLI:

   ```bash
   bun run cli start
   ```

3. Test commands:

   ```bash
   bun run cli start init
   bun run cli start add lucide:check
   ```

## Documentation

The documentation for this project is located in the `apps/docs` directory. You can run the documentation locally by running:

```bash
bun docs dev
```

Documentation is written using [MDX](https://mdxjs.com). You can find the documentation files in the `apps/docs/src/content/docs` directory.

When adding or modifying features, please ensure that you update the relevant documentation pages.

## Code Quality

This project uses **Ultracite** for code quality enforcement with Biome as the underlying engine.

Before committing, run:

```bash
bun lint:fix  # Auto-fix formatting and linting issues
bun lint      # Check for issues without fixing
```

All code is automatically formatted and linted via pre-commit hooks using [Lefthook](https://github.com/evilmartians/lefthook).

## Testing

Tests are written using Bun's built-in test runner. You can run all tests from the root of the repository:

```bash
bun test
```

To run tests in watch mode:

```bash
bun test --watch
```

To run tests for a specific file:

```bash
bun test apps/cli/src/commands/add.test.ts
```

Please ensure that tests are passing when submitting a pull request. If you're adding new features, please include tests.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

### When to create a changeset

Create a changeset for any user-facing changes:

- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes
- ✅ Performance improvements
- ✅ User-facing documentation improvements
- ❌ Internal refactoring (no user impact)
- ❌ Test-only changes
- ❌ CI/CD configuration

### Creating a changeset

Run the interactive CLI:

```bash
bun changeset
```

This will prompt you to:
1. Select the change type (patch, minor, or major)
2. Write a summary of your changes

### Change types (Semantic Versioning)

- **patch** (0.0.X) - Bug fixes, small improvements, no API changes
- **minor** (0.X.0) - New features, backward-compatible changes
- **major** (X.0.0) - Breaking changes, API removals/changes

### Publishing

**DO NOT manually run `changeset publish`.** Publishing is handled automatically by GitHub Actions when changes are merged to main.

The workflow:
1. Create your changeset and commit it with your changes
2. Open a pull request
3. After PR approval and merge to main, GitHub Actions automatically:
   - Bumps versions using `changeset version`
   - Updates CHANGELOG.md
   - Publishes to npm
   - Creates GitHub releases

## Commit Convention

Before you create a Pull Request, please check whether your commits comply with the commit conventions used in this repository.

When you create a commit we kindly ask you to follow the convention `category(scope): message` in your commit message while using one of the following categories:

- `feat`: new features or capabilities
- `fix`: bug fixes
- `docs`: documentation changes
- `test`: adding or updating tests
- `refactor`: code changes that neither fix bugs nor add features
- `perf`: performance improvements
- `chore`: maintenance tasks, dependency updates
- `ci`: continuous integration changes
- `build`: build system or dependency changes

Examples:
- `feat(cli): add forwardRef option for React icons`
- `fix(init): resolve config file overwrite issue`
- `docs(configuration): update forwardRef documentation`

If you are interested in the detailed specification, you can visit [Conventional Commits](https://www.conventionalcommits.org/).

## Pull Request Guidelines

1. **Write descriptive PR titles** using the conventional commits format
2. **Include a changeset** if your PR affects users (see Changesets section)
3. **Test thoroughly** - ensure all tests pass:
   ```bash
   bun test
   bun lint
   ```
4. **Update documentation** if you're adding or changing features
5. **Keep PRs focused** - one feature or fix per PR when possible
6. **Respond to feedback** - be open to suggestions and iterate on your changes

## Feature Requests

If you have a request for a new feature, please open a [GitHub Discussion](https://github.com/fellipeutaka/denji/discussions). We'll be happy to discuss it with you.

## Bug Reports

If you find a bug, please open a [GitHub Issue](https://github.com/fellipeutaka/denji/issues) with:
- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node/Bun version, etc.)

## Questions?

- **General questions**: Open a [GitHub Discussion](https://github.com/fellipeutaka/denji/discussions)
- **Bug reports**: Open a [GitHub Issue](https://github.com/fellipeutaka/denji/issues)
- **Feature requests**: Open a [GitHub Discussion](https://github.com/fellipeutaka/denji/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
