import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import { Err, Ok } from "~/utils/result";

// Create mock functions for fs utilities
const accessMock = mock((_path: string) => Promise.resolve(true));
const mkdirMock = mock((_path: string, _options?: { recursive?: boolean }) =>
  Promise.resolve<Ok<null, string> | Err<null, string>>(new Ok(null))
);
const writeFileMock = mock((_file: string, _data: string) =>
  Promise.resolve<Ok<null, string> | Err<null, string>>(new Ok(null))
);

// Create mock functions for @clack/prompts
const textMock = mock(() =>
  Promise.resolve<string | symbol>("./src/icons.tsx")
);
const selectMock = mock(() =>
  Promise.resolve<string | boolean | symbol>("react")
);
const confirmMock = mock(() => Promise.resolve(true));
const cancelMock = mock((_message?: string) => undefined);
const isCancelMock = mock((_value: unknown) => false);

// Mock modules before importing
mock.module("~/utils/fs", () => ({
  access: accessMock,
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

mock.module("@clack/prompts", () => ({
  intro: mock(() => undefined),
  outro: mock(() => undefined),
  text: textMock,
  select: selectMock,
  confirm: confirmMock,
  cancel: cancelMock,
  isCancel: isCancelMock,
}));

// Import after mocking
import { logger } from "~/utils/logger";
import { InitCommand, type InitOptions } from "./init";

// Helper to setup access mock behavior
function setupAccessMock(existingPaths: string[]) {
  accessMock.mockImplementation((path: string) => {
    return Promise.resolve(
      existingPaths.some((p) => path.endsWith(p) || path === p)
    );
  });
}

// Helper to get writeFile call by path pattern
function getWriteCall(pattern: string) {
  const calls = writeFileMock.mock.calls;
  return calls.find((c) => c[0].includes(pattern));
}

// Helper to parse config from writeFile call
function getWrittenConfig(
  pattern: string
): Record<string, unknown> | undefined {
  const call = getWriteCall(pattern);
  if (!call) {
    return undefined;
  }
  return JSON.parse(call[1]);
}

describe("InitCommand", () => {
  let command: InitCommand;
  let loggerSuccessSpy: ReturnType<typeof spyOn>;
  let loggerErrorSpy: ReturnType<typeof spyOn>;
  let processExitSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    command = new InitCommand();

    // Reset all mocks
    accessMock.mockReset();
    mkdirMock.mockReset();
    writeFileMock.mockReset();
    textMock.mockReset();
    selectMock.mockReset();
    confirmMock.mockReset();
    cancelMock.mockReset();
    isCancelMock.mockReset();

    // Default success implementations
    mkdirMock.mockResolvedValue(new Ok(null));
    writeFileMock.mockResolvedValue(new Ok(null));
    isCancelMock.mockReturnValue(false);

    // Spy on logger
    loggerSuccessSpy = spyOn(logger, "success").mockImplementation(
      () => undefined
    );
    loggerErrorSpy = spyOn(logger, "error").mockImplementation(() => undefined);

    // Mock process.exit for prompt cancellation tests
    processExitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    loggerSuccessSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("initializes with all options without prompts", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(textMock).not.toHaveBeenCalled();
      expect(selectMock).not.toHaveBeenCalled();
      expect(confirmMock).not.toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledTimes(2);
    });

    it("prompts for missing values", async () => {
      setupAccessMock(["/test/project"]);

      textMock.mockResolvedValue("./src/icons.tsx");
      selectMock.mockResolvedValueOnce("react").mockResolvedValueOnce("hidden");
      confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      const options: InitOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(textMock).toHaveBeenCalledTimes(1); // output
      expect(selectMock).toHaveBeenCalledTimes(2); // framework, a11y
      expect(confirmMock).toHaveBeenCalledTimes(2); // typescript, trackSource
      expect(writeFileMock).toHaveBeenCalledTimes(2);
    });

    it("accepts .tsx extension for React + TypeScript", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(writeFileMock).toHaveBeenCalledTimes(2);
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Created ./src/icons.tsx");
    });

    it("accepts .jsx extension for React + JavaScript", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.jsx",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(writeFileMock).toHaveBeenCalledTimes(2);
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Created ./src/icons.jsx");
    });

    it("creates parent directories when needed", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/components/ui/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      await command.run(options);

      expect(mkdirMock).toHaveBeenCalledWith(
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
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: strategy,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig("denji.json");
      expect(config?.a11y).toBe(strategy);
    });

    it("accepts a11y strategy: false via prompt", async () => {
      setupAccessMock(["/test/project"]);

      selectMock.mockResolvedValueOnce("react").mockResolvedValueOnce(false);
      confirmMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      const config = getWrittenConfig("denji.json");
      expect(config?.a11y).toBe(false);
    });

    it("writes trackSource true", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
      };

      await command.run(options);

      const config = getWrittenConfig("denji.json");
      expect(config?.trackSource).toBe(true);
    });

    it("writes trackSource false", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: false,
      };

      await command.run(options);

      const config = getWrittenConfig("denji.json");
      expect(config?.trackSource).toBe(false);
    });

    it("writes correct denji.json content", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
        trackSource: true,
      };

      await command.run(options);

      const config = getWrittenConfig("denji.json");
      expect(config).toBeDefined();
      expect(config?.output).toBe("./src/icons.tsx");
      expect(config?.framework).toBe("react");
      expect(config?.typescript).toBe(true);
      expect(config?.a11y).toBe("hidden");
      expect(config?.trackSource).toBe(true);
    });

    it("writes TypeScript icons template for react + typescript", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      await command.run(options);

      const iconsCall = getWriteCall("icons.tsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toContain("export type IconProps");
      expect(iconsCall?.[1]).toContain("as const satisfies");
    });

    it("writes JavaScript icons template for react + javascript", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.jsx",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      };

      await command.run(options);

      const iconsCall = getWriteCall("icons.jsx");
      expect(iconsCall).toBeDefined();
      expect(iconsCall?.[1]).toBe("export const Icons = {};\n");
    });

    it("logs success messages for created files", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      await command.run(options);

      expect(loggerSuccessSpy).toHaveBeenCalledWith("Created denji.json");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Created ./src/icons.tsx");
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("errors when cwd does not exist", async () => {
      setupAccessMock([]);

      const options: InitOptions = {
        cwd: "/nonexistent",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when denji.json already exists", async () => {
      setupAccessMock(["/test/project", "denji.json"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("already exists");
      }
    });

    it("errors when output file already exists", async () => {
      setupAccessMock(["/test/project", "icons.tsx"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Output file already exists");
      }
    });

    it("errors when extension is .ts for React + TypeScript", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.ts",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".ts"');
      }
    });

    it("errors when extension is .js for React + JavaScript", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.js",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".js"');
      }
    });

    it("errors when extension is .tsx for React + JavaScript", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: false,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".tsx"');
      }
    });

    it("errors with invalid framework value", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "vue",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid framework");
      }
    });

    it("errors with invalid a11y value", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "invalid",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid a11y strategy");
      }
    });

    it("errors when mkdir fails", async () => {
      setupAccessMock(["/test/project"]);
      mkdirMock.mockResolvedValue(new Err("Failed to create directory."));

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to create directory");
      }
    });

    it("errors when writeFile fails for config", async () => {
      setupAccessMock(["/test/project", "src"]);
      writeFileMock.mockResolvedValueOnce(new Err("Failed to write file."));

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write denji.json");
      }
    });

    it("errors when writeFile fails for icons", async () => {
      setupAccessMock(["/test/project", "src"]);
      writeFileMock
        .mockResolvedValueOnce(new Ok(null))
        .mockResolvedValueOnce(new Err("Failed to write file."));

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      const result = await command.run(options);

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
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./lib/components/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      await command.run(options);

      const config = getWrittenConfig("denji.json");
      expect(config?.output).toBe("./lib/components/icons.tsx");
    });

    it("handles nested output path", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/components/ui/icons/index.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      await command.run(options);

      expect(mkdirMock).toHaveBeenCalledWith(
        expect.stringContaining("src/components/ui/icons"),
        { recursive: true }
      );
    });

    it("skips mkdir when output dir already exists", async () => {
      setupAccessMock(["/test/project", "src"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      await command.run(options);

      expect(mkdirMock).not.toHaveBeenCalled();
    });

    it("exits gracefully when user cancels prompt", () => {
      setupAccessMock(["/test/project"]);
      isCancelMock.mockReturnValue(true);
      textMock.mockResolvedValue(Symbol.for("cancel"));

      const options: InitOptions = {
        cwd: "/test/project",
      };

      expect(command.run(options)).rejects.toThrow("process.exit(0)");
      expect(cancelMock).toHaveBeenCalled();
    });

    it("includes $schema default value in config", async () => {
      setupAccessMock(["/test/project"]);

      const options: InitOptions = {
        cwd: "/test/project",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        a11y: "hidden",
      };

      await command.run(options);

      const config = getWrittenConfig("denji.json");
      expect(config?.$schema).toBe(
        "https://denji-docs.vercel.app/configuration_schema.json"
      );
    });
  });
});
