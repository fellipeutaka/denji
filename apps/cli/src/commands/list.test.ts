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
import { parseIconsFile } from "~/utils/icons";
import { Err, Ok } from "~/utils/result";

// Create mock functions for fs utilities
const accessMock = mock((_path: string) => Promise.resolve(true));
const readFileMock = mock((_path: string, _encoding?: string) =>
  Promise.resolve<Ok<string, string> | Err<string, string>>(new Ok(""))
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
      forwardRef: false,
    })
  )
);

// Create mock for runHooks
const runHooksMock = mock((_hooks: string[] | undefined, _cwd: string) =>
  Promise.resolve<Ok<null, string> | Err<null, string>>(new Ok(null))
);

// Mock modules before importing
mock.module("~/utils/fs", () => ({
  access: accessMock,
  readFile: readFileMock,
}));

mock.module("~/utils/config", () => ({
  loadConfig: loadConfigMock,
}));

mock.module("~/utils/hooks", () => ({
  runHooks: runHooksMock,
}));

mock.module("~/utils/icons", () => ({
  parseIconsFile,
}));

mock.module("@clack/prompts", () => ({
  intro: mock(() => undefined),
  outro: mock(() => undefined),
}));

// Import after mocking
import { logger } from "~/utils/logger";
import { ListCommand, type ListOptions } from "./list";

describe("ListCommand", () => {
  let command: ListCommand;
  let loggerInfoSpy: ReturnType<typeof spyOn>;
  let loggerSuccessSpy: ReturnType<typeof spyOn>;
  let loggerBreakSpy: ReturnType<typeof spyOn>;
  let consoleInfoSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    command = new ListCommand();

    // Reset all mocks
    accessMock.mockReset();
    readFileMock.mockReset();
    loadConfigMock.mockReset();
    runHooksMock.mockReset();

    // Default success implementations with realistic icons file content
    accessMock.mockResolvedValue(true);
    readFileMock.mockResolvedValue(
      new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
} as const;
`)
    );
    loadConfigMock.mockResolvedValue(
      new Ok({
        $schema: "https://denji-docs.vercel.app/configuration_schema.json",
        output: "./src/icons.tsx",
        framework: "react",
        typescript: true,
        trackSource: true,
        forwardRef: false,
      })
    );
    runHooksMock.mockResolvedValue(new Ok(null));

    // Spy on logger
    loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => undefined);
    loggerSuccessSpy = spyOn(logger, "success").mockImplementation(
      () => undefined
    );
    loggerBreakSpy = spyOn(logger, "break").mockImplementation(() => undefined);

    // Spy on console.info for JSON output
    consoleInfoSpy = spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
    loggerSuccessSpy.mockRestore();
    loggerBreakSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("lists icons in formatted output", async () => {
      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(loggerSuccessSpy).toHaveBeenCalledWith(
        "Found 2 icon(s) in ./src/icons.tsx"
      );
      expect(loggerInfoSpy).toHaveBeenCalledWith("Icons:");
      expect(loggerInfoSpy).toHaveBeenCalledWith("  • Check");
      expect(loggerInfoSpy).toHaveBeenCalledWith("  • Home");
    });

    it("outputs JSON when --json flag is set", async () => {
      const options: ListOptions = {
        cwd: "/test/project",
        json: true,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);

      const jsonOutput = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(jsonOutput).toEqual({
        count: 2,
        output: "./src/icons.tsx",
        icons: ["Check", "Home"],
      });
    });

    it("shows info message when no icons found", async () => {
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {} as const;
`)
      );

      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        "No icons found in ./src/icons.tsx"
      );
      expect(loggerSuccessSpy).not.toHaveBeenCalled();
    });

    it("outputs empty JSON when no icons found with --json", async () => {
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {} as const;
`)
      );

      const options: ListOptions = {
        cwd: "/test/project",
        json: true,
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      const jsonOutput = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(jsonOutput).toEqual({
        count: 0,
        output: "./src/icons.tsx",
        icons: [],
      });
    });

    it("runs preList hooks before listing", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
          hooks: {
            preList: ["echo pre"],
          },
        })
      );

      const options: ListOptions = {
        cwd: "/test/project",
      };

      await command.run(options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo pre"], "/test/project");
    });

    it("runs postList hooks after listing", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
          hooks: {
            postList: ["echo post"],
          },
        })
      );

      const options: ListOptions = {
        cwd: "/test/project",
      };

      await command.run(options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo post"], "/test/project");
    });

    it("runs postList hooks after JSON output", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
          hooks: {
            postList: ["echo post"],
          },
        })
      );

      const options: ListOptions = {
        cwd: "/test/project",
        json: true,
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

      const options: ListOptions = {
        cwd: "/nonexistent",
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

      const options: ListOptions = {
        cwd: "/test/project",
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

      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
        expect(result.error).toContain('Run "denji init" first');
      }
    });

    it("errors when icons file cannot be read", async () => {
      readFileMock.mockResolvedValue(new Err("Failed to read file."));

      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("errors when preList hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
          hooks: {
            preList: ["exit 1"],
          },
        })
      );
      runHooksMock.mockResolvedValueOnce(new Err("Hook failed"));

      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when postList hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
          hooks: {
            postList: ["exit 1"],
          },
        })
      );
      runHooksMock
        .mockResolvedValueOnce(new Ok(null)) // preList
        .mockResolvedValueOnce(new Err("Hook failed")); // postList

      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when postList hook fails with JSON output", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
          hooks: {
            postList: ["exit 1"],
          },
        })
      );
      runHooksMock
        .mockResolvedValueOnce(new Ok(null)) // preList
        .mockResolvedValueOnce(new Err("Hook failed")); // postList

      const options: ListOptions = {
        cwd: "/test/project",
        json: true,
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
    it("handles single icon", async () => {
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
} as const;
`)
      );

      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(loggerSuccessSpy).toHaveBeenCalledWith(
        "Found 1 icon(s) in ./src/icons.tsx"
      );
    });

    it("handles many icons", async () => {
      const iconEntries = Array.from(
        { length: 100 },
        (_, i) => `  Icon${i}: (props) => (<svg {...props}></svg>)`
      ).join(",\n");
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
${iconEntries},
} as const;
`)
      );

      const options: ListOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(options);

      expect(result.isOk()).toBe(true);
      expect(loggerSuccessSpy).toHaveBeenCalledWith(
        "Found 100 icon(s) in ./src/icons.tsx"
      );
      // Verify each icon logged
      expect(loggerInfoSpy).toHaveBeenCalledTimes(101); // "Icons:" + 100 icons
    });

    it("uses config output path in messages", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./lib/components/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
        })
      );

      const options: ListOptions = {
        cwd: "/test/project",
      };

      await command.run(options);

      expect(loggerSuccessSpy).toHaveBeenCalledWith(
        "Found 2 icon(s) in ./lib/components/icons.tsx"
      );
    });

    it("includes config output in JSON response", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./custom/path/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
        })
      );

      const options: ListOptions = {
        cwd: "/test/project",
        json: true,
      };

      await command.run(options);

      const jsonOutput = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(jsonOutput.output).toBe("./custom/path/icons.tsx");
    });

    it("does not log formatted output with --json", async () => {
      const options: ListOptions = {
        cwd: "/test/project",
        json: true,
      };

      await command.run(options);

      expect(loggerSuccessSpy).not.toHaveBeenCalled();
      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });

    it("runs postList hooks even when no icons found", async () => {
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {} as const;
`)
      );
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          forwardRef: false,
          hooks: {
            postList: ["echo done"],
          },
        })
      );

      const options: ListOptions = {
        cwd: "/test/project",
      };

      await command.run(options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo done"], "/test/project");
    });
  });
});
