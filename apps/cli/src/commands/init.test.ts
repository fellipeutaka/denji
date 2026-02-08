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

  describe("execution flow", () => {
    it("validates cwd exists before proceeding", async () => {
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
      expect(deps.fs.writeFile).not.toHaveBeenCalled();
    });

    it("checks if denji.json already exists", async () => {
      const accessMock = createAccessMock(["/test/project", "denji.json"]);
      const deps = createInitDeps({
        fs: createMockFs({ access: accessMock }),
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

    it("checks if output file already exists", async () => {
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

    it("writes denji.json and icons file", async () => {
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

      expect(deps.fs.writeFile).toHaveBeenCalledTimes(2);
      expect(getWriteCall(deps.fs.writeFile, "denji.json")).toBeDefined();
      expect(getWriteCall(deps.fs.writeFile, "icons.tsx")).toBeDefined();
    });

    it("logs success for created files", async () => {
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

  describe("prompting", () => {
    it("skips prompts when all options provided", async () => {
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

      expect(deps.prompts.text).not.toHaveBeenCalled();
      expect(deps.prompts.select).not.toHaveBeenCalled();
      expect(deps.prompts.confirm).not.toHaveBeenCalled();
    });

    it("prompts for missing values", async () => {
      const selectMock = mock()
        .mockResolvedValueOnce("react")
        .mockResolvedValueOnce("hidden") as Prompter["select"];
      const confirmMock = mock<typeof deps.prompts.confirm>()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
        prompts: createMockPrompter({
          text: mock(() => Promise.resolve("./src/icons.tsx")),
          select: selectMock,
          confirm: confirmMock,
        }),
      });
      const command = new InitCommand(deps);

      await command.run({ cwd: "/test/project" });

      expect(deps.prompts.text).toHaveBeenCalled();
      expect(deps.prompts.select).toHaveBeenCalled();
      expect(deps.prompts.confirm).toHaveBeenCalled();
    });
  });

  describe("config writing", () => {
    it("writes correct config structure", async () => {
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
      expect(config).toMatchObject({
        $schema: "https://denji-docs.vercel.app/configuration_schema.json",
        output: { type: "file", path: "./src/icons.tsx" },
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
        react: { forwardRef: false },
      });
    });

    it("writes trackSource true when enabled", async () => {
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

    it("writes trackSource false when disabled", async () => {
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

    it("writes forwardRef option to framework config", async () => {
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

      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect((config?.react as Record<string, unknown>)?.forwardRef).toBe(true);
    });
  });

  describe("input validation", () => {
    it("validates framework value", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "angular",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid framework");
      }
    });

    it("validates a11y value", async () => {
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
    });

    it("accepts a11y: false via prompt", async () => {
      const selectMock = mock()
        .mockResolvedValueOnce("react")
        .mockResolvedValueOnce(false) as Prompter["select"];
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
        prompts: createMockPrompter({ select: selectMock }),
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
  });

  describe("extension validation", () => {
    it("accepts .tsx for TypeScript", async () => {
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
    });

    it("accepts .jsx for JavaScript", async () => {
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
    });

    it("rejects .ts for TypeScript (requires .tsx)", async () => {
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

    it("rejects .js for JavaScript (requires .jsx)", async () => {
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

    it("rejects .tsx for JavaScript", async () => {
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

    it("accepts .ts for Vue TypeScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.ts",
        framework: "vue",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isOk()).toBe(true);
    });

    it("accepts .js for Vue JavaScript", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.js",
        framework: "vue",
        typescript: false,
        a11y: "hidden",
      });

      expect(result.isOk()).toBe(true);
    });
  });

  describe("error handling", () => {
    it("returns error if cwd does not exist", async () => {
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

    it("returns error if mkdir fails", async () => {
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

    it("returns error if writeFile fails for config", async () => {
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

    it("returns error if writeFile fails for icons", async () => {
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

  describe("framework support", () => {
    it("accepts react framework", async () => {
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
      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.framework).toBe("react");
    });

    it("accepts preact framework", async () => {
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

    it("accepts solid framework", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "solid",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.framework).toBe("solid");
    });

    it("accepts vue framework", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.ts",
        framework: "vue",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig(deps.fs.writeFile, "denji.json");
      expect(config?.framework).toBe("vue");
    });

    it("rejects unsupported framework", async () => {
      const deps = createInitDeps({
        fs: createMockFs({ access: createAccessMock(["/test/project"]) }),
      });
      const command = new InitCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "angular",
        typescript: true,
        a11y: "hidden",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid framework");
      }
    });
  });
});
