import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import type { InitDeps, Prompter } from "~/services/deps";
import { Err, Ok } from "~/utils/result";
import {
  createInitDeps,
  createMockFs,
  createMockPrompter,
} from "./__tests__/test-utils";
import { InitCommand } from "./init";

// Helper to setup access mock behavior
function createAccessMock(existingPaths: string[]) {
  return mock((path: string) => {
    return Promise.resolve(
      existingPaths.some((p) => path.endsWith(p) || path === p)
    );
  });
}

// Helper to get writeFile call by path pattern
function getWriteCall(
  writeFileMock: InitDeps["fs"]["writeFile"],
  pattern: string
) {
  const calls = (writeFileMock as ReturnType<typeof mock>).mock.calls;
  return calls.find((c) => (c as [string, string])[0].includes(pattern));
}

// Helper to parse config from writeFile call
function getWrittenConfig(
  writeFileMock: InitDeps["fs"]["writeFile"],
  pattern: string
): Record<string, unknown> | undefined {
  const call = getWriteCall(writeFileMock, pattern);
  if (!call) {
    return undefined;
  }
  return JSON.parse(call[1]);
}

describe("InitCommand", () => {
  let processExitSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    processExitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    processExitSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("initializes with all options without prompts", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
        forwardRef: false,
      });

      expect(result.isOk()).toBe(true);
      expect(deps.prompts.text).not.toHaveBeenCalled();
      expect(deps.prompts.select).not.toHaveBeenCalled();
      expect(deps.prompts.confirm).not.toHaveBeenCalled();
      expect(deps.fs.writeFile).toHaveBeenCalledTimes(2);
    });

    it("prompts for missing values", async () => {
      const selectMock = mock()
        .mockResolvedValueOnce("react")
        .mockResolvedValueOnce("hidden") as Prompter["select"];
      const confirmMock = mock<typeof deps.prompts.confirm>()
        .mockResolvedValueOnce(true) // typescript
        .mockResolvedValueOnce(true); // trackSource
      // Note: forwardRef is handled by strategy.promptOptions (mocked in createMockFrameworks)
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
        prompts: createMockPrompter({
          text: mock(() => Promise.resolve("./src/icons.tsx")),
          select: selectMock,
          confirm: confirmMock,
        }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(deps.prompts.text).toHaveBeenCalledTimes(1); // output
      expect(deps.prompts.select).toHaveBeenCalledTimes(2); // framework, a11y
      expect(deps.prompts.confirm).toHaveBeenCalledTimes(2); // typescript, trackSource
      expect(deps.fs.writeFile).toHaveBeenCalledTimes(2);
    });

    it("accepts .tsx extension for React + TypeScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.fs.writeFile).toHaveBeenCalledTimes(2);
      expect(deps.logger.success).toHaveBeenCalledWith(
        "Created ./src/icons.tsx"
      );
    });

    it("accepts .jsx extension for React + JavaScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.jsx",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.fs.writeFile).toHaveBeenCalledTimes(2);
      expect(deps.logger.success).toHaveBeenCalledWith(
        "Created ./src/icons.jsx"
      );
    });

    it("creates parent directories when needed", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/components/ui/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(deps.fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining("src/components/ui"),
        { recursive: true }
      );
    });

    it.each([
      "hidden",
      "img",
      "title",
      "presentation",
    ])("accepts a11y strategy: %s", async (strategy) => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: strategy,
      });

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.a11y).toBe(strategy);
    });

    it("accepts a11y strategy: false via prompt", async () => {
      const selectMock = mock()
        .mockResolvedValueOnce("react")
        .mockResolvedValueOnce(false) as Prompter["select"];
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
        prompts: createMockPrompter({
          select: selectMock,
        }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
      });

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.a11y).toBe(false);
    });

    it("writes trackSource true", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.trackSource).toBe(true);
    });

    it("writes trackSource false", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: false,
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.trackSource).toBe(false);
    });

    it("writes correct denji.json content", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config).toBeDefined();
      expect(config?.output).toBe("./src/icons.tsx");
      expect(config?.framework).toBe("react");
      expect(config?.typescript).toBe(true);
      expect(config?.a11y).toBe("hidden");
      expect(config?.trackSource).toBe(true);
    });

    it("writes TypeScript icons template for react + typescript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        forwardRef: false,
      });

      const iconsCall = getWriteCall(deps.fs.writeFile, "icons.tsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toBe(
        `export type IconProps = React.ComponentProps<"svg">;
export type Icon = (props: IconProps) => React.JSX.Element;

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
`
      );
    });

    it("writes JavaScript icons template for react + javascript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.jsx",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      });

      const iconsCall = getWriteCall(deps.fs.writeFile, "icons.jsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toBe("export const Icons = {};\n");
    });

    it("logs success messages for created files", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(deps.logger.success).toHaveBeenCalledWith("Created denji.json");
      expect(deps.logger.success).toHaveBeenCalledWith(
        "Created ./src/icons.tsx"
      );
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("errors when cwd does not exist", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock([]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/nonexistent",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when denji.json already exists", async () => {
      const deps = createInitDeps({
        fs: createMockFs({
          access: createAccessMock(["/test/project", "denji.json"]),
        }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("already exists");
      }
    });

    it("errors when output file already exists", async () => {
      const deps = createInitDeps({
        fs: createMockFs({
          access: createAccessMock(["/test/project", "icons.tsx"]),
        }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Output file already exists");
      }
    });

    it("errors when extension is .ts for React + TypeScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.ts",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".ts"');
      }
    });

    it("errors when extension is .js for React + JavaScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.js",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".js"');
      }
    });

    it("errors when extension is .tsx for React + JavaScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".tsx"');
      }
    });

    it("errors with invalid framework value", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "vue",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid framework");
      }
    });

    it("errors with invalid a11y value", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "invalid",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid a11y strategy");
      }
    });

    it("errors when mkdir fails", async () => {
      const deps = createInitDeps({
        fs: createMockFs({
          access: createAccessMock(["/test/project"]),
          mkdir: mock(() =>
            Promise.resolve(new Err("Failed to create directory."))
          ),
        }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to create directory");
      }
    });

    it("errors when writeFile fails for config", async () => {
      const deps = createInitDeps({
        fs: createMockFs({
          access: createAccessMock(["/test/project", "src"]),
          writeFile: mock(() =>
            Promise.resolve(new Err("Failed to write file."))
          ),
        }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write denji.json");
      }
    });

    it("errors when writeFile fails for icons", async () => {
      const writeFileMock = mock<typeof deps.fs.writeFile>()
        .mockResolvedValueOnce(new Ok(null))
        .mockResolvedValueOnce(new Err("Failed to write file."));
      const deps = createInitDeps({
        fs: createMockFs({
          access: createAccessMock(["/test/project", "src"]),
          writeFile: writeFileMock,
        }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write");
      }
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe("edge cases", () => {
    it("handles custom output path", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./lib/components/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.output).toBe("./lib/components/icons.tsx");
    });

    it("handles nested output path", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/components/ui/icons/index.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(deps.fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining("src/components/ui/icons"),
        { recursive: true }
      );
    });

    it("skips mkdir when output dir already exists", async () => {
      const deps = createInitDeps({
        fs: createMockFs({
          access: createAccessMock(["/test/project", "src"]),
        }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      expect(deps.fs.mkdir).not.toHaveBeenCalled();
    });

    it("includes $schema default value in config", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.$schema).toBe(
        "https://denji-docs.vercel.app/configuration_schema.json"
      );
    });
  });

  // ============================================
  // FORWARDREF TESTS
  // ============================================

  describe("forwardRef option", () => {
    it("uses forwardRef from context when provided", async () => {
      // Note: forwardRef prompting is handled by strategy.promptOptions
      // When forwardRef is passed in options, it's used directly
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        forwardRef: true,
      });

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect((config?.react as Record<string, unknown>)?.forwardRef).toBe(true);
    });

    it("writes forwardRef: true to config when enabled", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
        forwardRef: true,
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect((config?.react as Record<string, unknown>)?.forwardRef).toBe(true);
    });

    it("writes forwardRef: false to config when disabled", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
        forwardRef: false,
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect((config?.react as Record<string, unknown>)?.forwardRef).toBe(
        false
      );
    });

    it("writes forwardRef Icon type in template when forwardRef is true", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        forwardRef: true,
      });

      const iconsCall = getWriteCall(deps.fs.writeFile, "icons.tsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toContain(
        'React.ForwardRefExoticComponent<IconProps & React.ComponentRef<"svg">>'
      );
    });

    it("writes regular Icon type in template when forwardRef is false", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        forwardRef: false,
      });

      const iconsCall = getWriteCall(deps.fs.writeFile, "icons.tsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toContain(
        "(props: IconProps) => React.JSX.Element"
      );
      expect(iconsCall?.[1]).not.toContain("ForwardRefExoticComponent");
    });
  });

  // ============================================
  // PREACT FRAMEWORK TESTS
  // ============================================

  describe("Preact framework", () => {
    it("accepts Preact as framework option", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "preact",
        typescript: true,
        a11y: "hidden",
        forwardRef: false,
      });

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.framework).toBe("preact");
    });

    it("writes Preact TypeScript template", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "preact",
        typescript: true,
        a11y: "hidden",
        forwardRef: false,
      });

      const iconsCall = getWriteCall(deps.fs.writeFile, "icons.tsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toContain(
        'import type * as preact from "preact/compat"'
      );
      expect(iconsCall?.[1]).toContain("preact.ComponentProps");
      expect(iconsCall?.[1]).toContain("preact.JSX.Element");
    });

    it("writes Preact JavaScript template", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.jsx",
        framework: "preact",
        typescript: false,
        a11y: "hidden",
      });

      const iconsCall = getWriteCall(deps.fs.writeFile, "icons.jsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toBe("export const Icons = {};\n");
    });

    it("writes Preact forwardRef type when enabled", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "preact",
        typescript: true,
        a11y: "hidden",
        forwardRef: true,
      });

      const iconsCall = getWriteCall(deps.fs.writeFile, "icons.tsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toContain("preact.ForwardRefExoticComponent");
      expect(iconsCall?.[1]).toContain("preact.RefAttributes<SVGSVGElement>");
    });

    it("writes Preact config with forwardRef option", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "preact",
        typescript: true,
        a11y: "hidden",
        forwardRef: true,
      });

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect((config?.preact as Record<string, unknown>)?.forwardRef).toBe(
        true
      );
    });

    it("validates .tsx extension for Preact + TypeScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.ts",
        framework: "preact",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".ts"');
        expect(result.error).toContain("preact");
      }
    });

    it("validates .jsx extension for Preact + JavaScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.js",
        framework: "preact",
        typescript: false,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".js"');
        expect(result.error).toContain("preact");
      }
    });
  });
});
