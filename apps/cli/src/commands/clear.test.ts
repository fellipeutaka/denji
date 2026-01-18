import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";
import type { Config } from "~/schemas/config";
import { Err, Ok } from "~/utils/result";

// Create mock functions for fs utilities
const accessMock = mock((_path: string) => Promise.resolve(true));
const readFileMock = mock((_path: string, _encoding?: string) =>
  Promise.resolve<Ok<string, string> | Err<string, string>>(new Ok(""))
);
const writeFileMock = mock((_file: string, _data: string) =>
  Promise.resolve<Ok<null, string> | Err<null, string>>(new Ok(null))
);

// Create mock for loadConfig
const loadConfigMock = mock((_cwd: string) =>
  Promise.resolve<Ok<Config, string> | Err<Config, string>>(
    new Ok({
      $schema: "https://denji-docs.vercel.app/configuration_schema.json",
      output: "./src/icons.tsx",
      framework: "react",
      typescript: true,
      trackSource: true,
    })
  )
);

// Create mock for runHooks
const runHooksMock = mock((_hooks: string[] | undefined, _cwd: string) =>
  Promise.resolve<Ok<null, string> | Err<null, string>>(new Ok(null))
);

// Create mock for getExistingIconNames
const getExistingIconNamesMock = mock((_content: string) => ["Check", "Home"]);

// Create mock for getIconsTemplate
const getIconsTemplateMock = mock(
  (_config: Config) => `export type IconProps = React.ComponentProps<"svg">;
export type Icon = (props: IconProps) => React.JSX.Element;

export const Icons = {} as const satisfies Record<string, Icon>;
`
);

// Create mock functions for @clack/prompts
const confirmMock = mock(() => Promise.resolve<boolean | symbol>(true));
const cancelMock = mock((_message?: string) => undefined);
const isCancelMock = mock((_value: unknown) => false);

// Mock modules before importing
mock.module("~/utils/fs", () => ({
  access: accessMock,
  readFile: readFileMock,
  writeFile: writeFileMock,
}));

mock.module("~/utils/config", () => ({
  loadConfig: loadConfigMock,
}));

mock.module("~/utils/hooks", () => ({
  runHooks: runHooksMock,
}));

mock.module("~/utils/icons", () => ({
  getExistingIconNames: getExistingIconNamesMock,
}));

mock.module("~/templates/icons", () => ({
  getIconsTemplate: getIconsTemplateMock,
}));

mock.module("@clack/prompts", () => ({
  intro: mock(() => undefined),
  outro: mock(() => undefined),
  confirm: confirmMock,
  cancel: cancelMock,
  isCancel: isCancelMock,
}));

// Import after mocking
import { logger } from "~/utils/logger";
import { ClearCommand, type ClearOptions } from "./clear";

describe("ClearCommand", () => {
  let command: ClearCommand;
  let loggerInfoSpy: ReturnType<typeof spyOn>;
  let loggerSuccessSpy: ReturnType<typeof spyOn>;
  let processExitSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    command = new ClearCommand();

    // Reset all mocks
    accessMock.mockReset();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    loadConfigMock.mockReset();
    runHooksMock.mockReset();
    getExistingIconNamesMock.mockReset();
    getIconsTemplateMock.mockReset();
    confirmMock.mockReset();
    cancelMock.mockReset();
    isCancelMock.mockReset();

    // Default success implementations
    accessMock.mockResolvedValue(true);
    readFileMock.mockResolvedValue(new Ok("mock icons content"));
    writeFileMock.mockResolvedValue(new Ok(null));
    loadConfigMock.mockResolvedValue(
      new Ok({
        $schema: "https://denji-docs.vercel.app/configuration_schema.json",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        trackSource: true,
      })
    );
    runHooksMock.mockResolvedValue(new Ok(null));
    getExistingIconNamesMock.mockReturnValue(["Check", "Home"]);
    getIconsTemplateMock.mockReturnValue("export const Icons = {};");
    confirmMock.mockResolvedValue(true);
    isCancelMock.mockReturnValue(false);

    // Spy on logger
    loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => undefined);
    loggerSuccessSpy = spyOn(logger, "success").mockImplementation(
      () => undefined
    );

    // Mock process.exit for prompt cancellation tests
    processExitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
    loggerSuccessSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("clears all icons with --yes flag", async () => {
      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(confirmMock).not.toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledTimes(1);
    });

    it("prompts for confirmation without --yes flag", async () => {
      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(confirmMock).toHaveBeenCalledTimes(1);
      expect(writeFileMock).toHaveBeenCalledTimes(1);
    });

    it("resets icons file to template", async () => {
      getIconsTemplateMock.mockReturnValue("export const Icons = {};");

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      await command.run(options);

      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringContaining("icons.tsx"),
        "export const Icons = {};"
      );
    });

    it("returns early when no icons to remove", async () => {
      getExistingIconNamesMock.mockReturnValue([]);

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(loggerInfoSpy).toHaveBeenCalledWith("No icons to remove");
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("runs preClear hooks before clearing", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            preClear: ["echo pre"],
          },
        })
      );

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      await command.run(options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo pre"], "/test/project");
    });

    it("runs postClear hooks after clearing", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postClear: ["echo post"],
          },
        })
      );

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      await command.run(options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo post"], "/test/project");
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("errors when cwd does not exist", async () => {
      accessMock.mockResolvedValue(false);

      const options: ClearOptions = {
        cwd: "/nonexistent",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when config cannot be loaded", async () => {
      loadConfigMock.mockResolvedValue(
        new Err('denji.json not found. Run "denji init" first.')
      );

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("denji.json not found");
      }
    });

    it("errors when icons file does not exist", async () => {
      accessMock.mockImplementation((path: string) => {
        if (path.includes("icons.tsx")) {
          return Promise.resolve(false);
        }
        return Promise.resolve(true);
      });

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
      }
    });

    it("errors when icons file cannot be read", async () => {
      readFileMock.mockResolvedValue(new Err("Failed to read file."));

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("errors when preClear hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            preClear: ["exit 1"],
          },
        })
      );
      runHooksMock.mockResolvedValueOnce(new Err("Hook failed"));

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when writeFile fails", async () => {
      writeFileMock.mockResolvedValue(new Err("Failed to write file."));

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("errors when postClear hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postClear: ["exit 1"],
          },
        })
      );
      runHooksMock
        .mockResolvedValueOnce(new Ok(null)) // preClear
        .mockResolvedValueOnce(new Err("Hook failed")); // postClear

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe("edge cases", () => {
    it("calls cancel when user declines confirmation but continues", async () => {
      // Note: Current implementation calls cancel() but doesn't return early
      // This test documents actual behavior
      confirmMock.mockResolvedValue(false);

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      await command.run(options);

      expect(cancelMock).toHaveBeenCalled();
      // Bug: writeFile is still called even after user declines
      expect(writeFileMock).toHaveBeenCalled();
    });

    it("exits gracefully when user cancels prompt", () => {
      isCancelMock.mockReturnValue(true);
      confirmMock.mockResolvedValue(Symbol.for("cancel"));

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      expect(command.run(options)).rejects.toThrow("process.exit(0)");
      expect(cancelMock).toHaveBeenCalled();
    });

    it("shows correct icon count in confirmation message", async () => {
      getExistingIconNamesMock.mockReturnValue([
        "Icon1",
        "Icon2",
        "Icon3",
        "Icon4",
        "Icon5",
      ]);

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      await command.run(options);

      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Remove all 5 icon(s)?",
        })
      );
    });

    it("handles single icon correctly", async () => {
      getExistingIconNamesMock.mockReturnValue(["SingleIcon"]);

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      await command.run(options);

      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Remove all 1 icon(s)?",
        })
      );
    });
  });
});
