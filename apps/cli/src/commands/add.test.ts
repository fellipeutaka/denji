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

// Create mock for icon utilities
type IconNameResult =
  | Ok<{ source: string; name: string }, string>
  | Err<{ source: string; name: string }, string>;
const validateIconNameMock = mock(
  (_icon: string) =>
    new Ok({ source: "lucide", name: "check" }) as IconNameResult
);
const getExistingIconNamesMock = mock((_content: string) => [] as string[]);
const toComponentNameMock = mock((icon: string) => {
  const name = icon.split(":")[1] || icon;
  return name.charAt(0).toUpperCase() + name.slice(1);
});
const fetchIconMock = mock((_icon: string) =>
  Promise.resolve<Ok<string, string> | Err<string, string>>(
    new Ok('<svg><path d="M0 0h24v24H0z"/></svg>')
  )
);
const svgToComponentMock = mock(
  (
    _svg: string,
    name: string,
    _options: { a11y?: unknown; trackSource?: boolean; iconName?: string }
  ) => Promise.resolve(`export const ${name} = () => <svg />;`)
);
const insertIconAlphabeticallyMock = mock(
  (_content: string, _name: string, component: string) =>
    `${_content}\n${component}`
);
const replaceIconMock = mock(
  (_content: string, _name: string, component: string) => component
);

// Create mock for enhanced confirm
const enhancedConfirmMock = mock(
  (_options: { message: string; initialValue?: boolean }) =>
    Promise.resolve(true)
);

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
  validateIconName: validateIconNameMock,
  getExistingIconNames: getExistingIconNamesMock,
  toComponentName: toComponentNameMock,
  fetchIcon: fetchIconMock,
  svgToComponent: svgToComponentMock,
  insertIconAlphabetically: insertIconAlphabeticallyMock,
  replaceIcon: replaceIconMock,
}));

mock.module("~/utils/prompts", () => ({
  enhancedConfirm: enhancedConfirmMock,
}));

mock.module("@clack/prompts", () => ({
  intro: mock(() => undefined),
  outro: mock(() => undefined),
}));

// Import after mocking
import { logger } from "~/utils/logger";
import { AddCommand, type AddOptions } from "./add";

describe("AddCommand", () => {
  let command: AddCommand;
  let loggerInfoSpy: ReturnType<typeof spyOn>;
  let loggerSuccessSpy: ReturnType<typeof spyOn>;
  let loggerErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    command = new AddCommand();

    // Reset all mocks
    accessMock.mockReset();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    loadConfigMock.mockReset();
    runHooksMock.mockReset();
    validateIconNameMock.mockReset();
    getExistingIconNamesMock.mockReset();
    toComponentNameMock.mockReset();
    fetchIconMock.mockReset();
    svgToComponentMock.mockReset();
    insertIconAlphabeticallyMock.mockReset();
    replaceIconMock.mockReset();
    enhancedConfirmMock.mockReset();

    // Default success implementations
    accessMock.mockResolvedValue(true);
    readFileMock.mockResolvedValue(new Ok("export const Icons = {};"));
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
    validateIconNameMock.mockReturnValue(
      new Ok({ source: "lucide", name: "check" })
    );
    getExistingIconNamesMock.mockReturnValue([]);
    toComponentNameMock.mockImplementation((icon: string) => {
      const name = icon.split(":")[1] || icon;
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
    fetchIconMock.mockResolvedValue(
      new Ok('<svg><path d="M0 0h24v24H0z"/></svg>')
    );
    svgToComponentMock.mockImplementation((_svg, name) =>
      Promise.resolve(`export const ${name} = () => <svg />;`)
    );
    insertIconAlphabeticallyMock.mockImplementation(
      (content, _name, component) => `${content}\n${component}`
    );
    replaceIconMock.mockImplementation(
      (_content, _name, component) => component
    );
    enhancedConfirmMock.mockResolvedValue(true);

    // Spy on logger
    loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => undefined);
    loggerSuccessSpy = spyOn(logger, "success").mockImplementation(
      () => undefined
    );
    loggerErrorSpy = spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
    loggerSuccessSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("adds a single icon", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isOk()).toBe(true);
      expect(fetchIconMock).toHaveBeenCalledWith("lucide:check");
      expect(svgToComponentMock).toHaveBeenCalled();
      expect(insertIconAlphabeticallyMock).toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalled();
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Added Check");
    });

    it("adds multiple icons", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(
        ["lucide:check", "lucide:home"],
        options
      );

      expect(result.isOk()).toBe(true);
      expect(fetchIconMock).toHaveBeenCalledTimes(2);
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Added Check");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Added Home");
    });

    it("uses custom name with --name option", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
        name: "CustomIcon",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isOk()).toBe(true);
      expect(svgToComponentMock).toHaveBeenCalledWith(
        expect.any(String),
        "CustomIcon",
        expect.any(Object)
      );
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Added CustomIcon");
    });

    it("overwrites existing icon when confirmed", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);
      enhancedConfirmMock.mockResolvedValue(true);

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isOk()).toBe(true);
      expect(enhancedConfirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Icon "Check" already exists. Overwrite?',
        })
      );
      expect(replaceIconMock).toHaveBeenCalled();
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Replaced Check");
    });

    it("skips existing icon when overwrite declined", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);
      enhancedConfirmMock.mockResolvedValue(false);

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isOk()).toBe(true);
      expect(loggerInfoSpy).toHaveBeenCalledWith("Skipped Check");
      expect(replaceIconMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("uses a11y override from --a11y option", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
        a11y: "img",
      };

      await command.run(["lucide:check"], options);

      expect(svgToComponentMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ a11y: "img" })
      );
    });

    it("handles a11y: false string correctly", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
        a11y: "false",
      };

      await command.run(["lucide:check"], options);

      expect(svgToComponentMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ a11y: false })
      );
    });

    it("runs preAdd hooks before adding", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            preAdd: ["echo pre"],
          },
        })
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo pre"], "/test/project");
    });

    it("runs postAdd hooks after adding", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postAdd: ["echo post"],
          },
        })
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo post"], "/test/project");
    });

    it("passes trackSource from config", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: false,
        })
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      expect(svgToComponentMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ trackSource: false })
      );
    });

    it("passes iconName to svgToComponent", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      expect(svgToComponentMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ iconName: "lucide:check" })
      );
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("errors when cwd does not exist", async () => {
      accessMock.mockResolvedValue(false);

      const options: AddOptions = {
        cwd: "/nonexistent",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when --name used with multiple icons", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
        name: "CustomIcon",
      };

      const result = await command.run(
        ["lucide:check", "lucide:home"],
        options
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain(
          "--name can only be used with a single icon"
        );
      }
    });

    it("errors when icon name is invalid", async () => {
      validateIconNameMock.mockReturnValue(
        new Err('Invalid icon format: "invalid". Use "source:name" format.')
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["invalid"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid icon format");
      }
    });

    it("errors with invalid --a11y value", async () => {
      const options: AddOptions = {
        cwd: "/test/project",
        a11y: "invalid",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid a11y strategy");
      }
    });

    it("errors when config cannot be loaded", async () => {
      loadConfigMock.mockResolvedValue(
        new Err('denji.json not found. Run "denji init" first.')
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("denji.json not found");
      }
    });

    it("errors when preAdd hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            preAdd: ["exit 1"],
          },
        })
      );
      runHooksMock.mockResolvedValueOnce(new Err("Hook failed"));

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when icons file does not exist", async () => {
      accessMock.mockImplementation((path: string) => {
        if (path.includes("icons.tsx")) {
          return Promise.resolve(false);
        }
        return Promise.resolve(true);
      });

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
        expect(result.error).toContain('Run "denji init" first');
      }
    });

    it("errors when icons file cannot be read", async () => {
      readFileMock.mockResolvedValue(new Err("Failed to read file."));

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("logs error and continues when fetch fails for one icon", async () => {
      fetchIconMock
        .mockResolvedValueOnce(new Err("Network error"))
        .mockResolvedValueOnce(new Ok("<svg></svg>"));

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(
        ["lucide:check", "lucide:home"],
        options
      );

      expect(result.isOk()).toBe(true);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch lucide:check: Network error"
      );
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Added Home");
    });

    it("errors when writeFile fails", async () => {
      writeFileMock.mockResolvedValue(new Err("Failed to write file."));

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("errors when postAdd hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postAdd: ["exit 1"],
          },
        })
      );
      runHooksMock
        .mockResolvedValueOnce(new Ok(null)) // preAdd
        .mockResolvedValueOnce(new Err("Hook failed")); // postAdd

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["lucide:check"], options);

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
    it("does not write file when all icons skipped", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);
      enhancedConfirmMock.mockResolvedValue(false);

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("does not run postAdd hooks when no icons added", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);
      enhancedConfirmMock.mockResolvedValue(false);
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postAdd: ["echo post"],
          },
        })
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      // postAdd should not be called because addedCount is 0
      expect(runHooksMock).toHaveBeenCalledTimes(1); // only preAdd
    });

    it("handles mixed success and failure gracefully", async () => {
      fetchIconMock
        .mockResolvedValueOnce(new Ok("<svg>1</svg>"))
        .mockResolvedValueOnce(new Err("Not found"))
        .mockResolvedValueOnce(new Ok("<svg>3</svg>"));

      const options: AddOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(
        ["lucide:check", "lucide:missing", "lucide:home"],
        options
      );

      expect(result.isOk()).toBe(true);
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Added Check");
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch lucide:missing: Not found"
      );
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Added Home");
      expect(writeFileMock).toHaveBeenCalled();
    });

    it("uses config a11y when no override provided", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          a11y: "presentation",
        })
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      expect(svgToComponentMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ a11y: "presentation" })
      );
    });

    it("defaults trackSource to true when not in config", async () => {
      // Use type assertion to test behavior when trackSource is undefined
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: undefined,
        } as unknown as Config)
      );

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check"], options);

      expect(svgToComponentMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ trackSource: true })
      );
    });

    it("tracks newly added icons to prevent duplicates in same batch", async () => {
      // First call returns empty array, simulating initial state
      getExistingIconNamesMock.mockReturnValue([]);

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(["lucide:check", "lucide:home"], options);

      // Both should be added (insertIconAlphabetically called for both)
      expect(insertIconAlphabeticallyMock).toHaveBeenCalledTimes(2);
    });

    it("accepts all valid a11y strategies", async () => {
      const strategies = ["hidden", "img", "title", "presentation"];

      for (const strategy of strategies) {
        svgToComponentMock.mockClear();

        const options: AddOptions = {
          cwd: "/test/project",
          a11y: strategy,
        };

        const result = await command.run(["lucide:check"], options);

        expect(result.isOk()).toBe(true);
        expect(svgToComponentMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({ a11y: strategy })
        );
      }
    });

    it("handles icon from different sources", async () => {
      toComponentNameMock.mockImplementation((icon: string) => {
        const parts = icon.split(":");
        const name = parts[1] ?? parts[0] ?? "";
        return name.charAt(0).toUpperCase() + name.slice(1);
      });

      const options: AddOptions = {
        cwd: "/test/project",
      };

      await command.run(
        ["mdi:home", "lucide:check", "heroicons:star"],
        options
      );

      expect(fetchIconMock).toHaveBeenCalledWith("mdi:home");
      expect(fetchIconMock).toHaveBeenCalledWith("lucide:check");
      expect(fetchIconMock).toHaveBeenCalledWith("heroicons:star");
    });
  });
});
