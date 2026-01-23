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
// Import real icon utilities (already tested in icons.test.ts)
import { getExistingIconNames } from "~/utils/icons";
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

// Create mock functions for prompts
const enhancedConfirmMock = mock(
  (_options: { message: string; initialValue?: boolean }) =>
    Promise.resolve<boolean | symbol>(true)
);
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
  getExistingIconNames,
}));

mock.module("~/utils/prompts", () => ({
  enhancedConfirm: enhancedConfirmMock,
  CANCEL_MESSAGE: "Operation cancelled.",
}));

mock.module("@clack/prompts", () => ({
  intro: mock(() => undefined),
  outro: mock(() => undefined),
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
    enhancedConfirmMock.mockReset();
    cancelMock.mockReset();
    isCancelMock.mockReset();

    // Default success implementations with realistic icons file content
    accessMock.mockResolvedValue(true);
    readFileMock.mockResolvedValue(
      new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
} as const;
`)
    );
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
    enhancedConfirmMock.mockResolvedValue(true);
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
      expect(enhancedConfirmMock).not.toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledTimes(1);
    });

    it("prompts for confirmation without --yes flag", async () => {
      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(enhancedConfirmMock).toHaveBeenCalledTimes(1);
      expect(writeFileMock).toHaveBeenCalledTimes(1);
    });

    it("resets icons file to template", async () => {
      const options: ClearOptions = {
        cwd: "/test/project",
        yes: true,
      };

      await command.run(options);

      // Uses real getIconsTemplate - config has typescript: true
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringContaining("icons.tsx"),
        expect.stringContaining("export const Icons = {}")
      );
    });

    it("returns early when no icons to remove", async () => {
      // Use empty icons file
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {} as const;
`)
      );

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
      enhancedConfirmMock.mockResolvedValue(false);

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      await command.run(options);

      expect(cancelMock).toHaveBeenCalled();
      // Bug: writeFile is still called even after user declines
      expect(writeFileMock).toHaveBeenCalled();
    });

    it("exits gracefully when user cancels prompt", async () => {
      // enhancedConfirm calls process.exit(0) when cancelled
      enhancedConfirmMock.mockImplementation(() => {
        process.exit(0);
      });

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      await expect(command.run(options)).rejects.toThrow("process.exit(0)");
    });

    it("shows correct icon count in confirmation message", async () => {
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  Icon1: (props) => (<svg {...props}></svg>),
  Icon2: (props) => (<svg {...props}></svg>),
  Icon3: (props) => (<svg {...props}></svg>),
  Icon4: (props) => (<svg {...props}></svg>),
  Icon5: (props) => (<svg {...props}></svg>),
} as const;
`)
      );

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      await command.run(options);

      expect(enhancedConfirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Remove all 5 icon(s)?",
        })
      );
    });

    it("handles single icon correctly", async () => {
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  SingleIcon: (props) => (<svg {...props}></svg>),
} as const;
`)
      );

      const options: ClearOptions = {
        cwd: "/test/project",
        yes: false,
      };

      await command.run(options);

      expect(enhancedConfirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Remove all 1 icon(s)?",
        })
      );
    });
  });
});
