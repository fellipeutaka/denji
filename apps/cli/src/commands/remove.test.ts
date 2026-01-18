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

// Create mock for removeIcon
const removeIconMock = mock(
  (_content: string, _iconName: string) => "updated content"
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
  getExistingIconNames: getExistingIconNamesMock,
  removeIcon: removeIconMock,
}));

mock.module("@clack/prompts", () => ({
  intro: mock(() => undefined),
  outro: mock(() => undefined),
}));

// Import after mocking
import { logger } from "~/utils/logger";
import { RemoveCommand, type RemoveOptions } from "./remove";

describe("RemoveCommand", () => {
  let command: RemoveCommand;
  let loggerSuccessSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    command = new RemoveCommand();

    // Reset all mocks
    accessMock.mockReset();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    loadConfigMock.mockReset();
    runHooksMock.mockReset();
    getExistingIconNamesMock.mockReset();
    removeIconMock.mockReset();

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
    getExistingIconNamesMock.mockReturnValue(["Check", "Home", "Star"]);
    removeIconMock.mockReturnValue("updated content");

    // Spy on logger
    loggerSuccessSpy = spyOn(logger, "success").mockImplementation(
      () => undefined
    );
  });

  afterEach(() => {
    loggerSuccessSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("removes a single icon", async () => {
      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

      expect(result.isOk()).toBe(true);
      expect(removeIconMock).toHaveBeenCalledWith(
        "mock icons content",
        "Check"
      );
      expect(writeFileMock).toHaveBeenCalled();
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Check");
    });

    it("removes multiple icons", async () => {
      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check", "Home"], options);

      expect(result.isOk()).toBe(true);
      expect(removeIconMock).toHaveBeenCalledTimes(2);
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Check");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Home");
    });

    it("resets to template when removing all icons", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check", "Home"]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check", "Home"], options);

      expect(result.isOk()).toBe(true);
      // Should use template, not removeIcon
      expect(removeIconMock).not.toHaveBeenCalled();
      // Uses real getIconsTemplate - config has typescript: true
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringContaining("icons.tsx"),
        expect.stringContaining("export const Icons = {}")
      );
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Check");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Home");
    });

    it("runs preRemove hooks before removing", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            preRemove: ["echo pre"],
          },
        })
      );

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check"], options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo pre"], "/test/project");
    });

    it("runs postRemove hooks after removing", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postRemove: ["echo post"],
          },
        })
      );

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check"], options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo post"], "/test/project");
    });

    it("runs postRemove hooks after resetting to template", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postRemove: ["echo post"],
          },
        })
      );

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check"], options);

      expect(runHooksMock).toHaveBeenCalledWith(["echo post"], "/test/project");
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("errors when cwd does not exist", async () => {
      accessMock.mockResolvedValue(false);

      const options: RemoveOptions = {
        cwd: "/nonexistent",
      };

      const result = await command.run(["Check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when config cannot be loaded", async () => {
      loadConfigMock.mockResolvedValue(
        new Err('denji.json not found. Run "denji init" first.')
      );

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

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

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
        expect(result.error).toContain('Run "denji init" first');
      }
    });

    it("errors when icons file cannot be read", async () => {
      readFileMock.mockResolvedValue(new Err("Failed to read file."));

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("errors when icon does not exist", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check", "Home"]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["NotFound"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icon(s) not found: NotFound");
      }
    });

    it("errors when multiple icons do not exist", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["NotFound1", "NotFound2"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icon(s) not found");
        expect(result.error).toContain("NotFound1");
        expect(result.error).toContain("NotFound2");
      }
    });

    it("errors when some icons exist and some do not", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check", "Home"]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check", "NotFound"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icon(s) not found: NotFound");
      }
    });

    it("errors when preRemove hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            preRemove: ["exit 1"],
          },
        })
      );
      runHooksMock.mockResolvedValueOnce(new Err("Hook failed"));

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when writeFile fails", async () => {
      writeFileMock.mockResolvedValue(new Err("Failed to write file."));

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("errors when writeFile fails during template reset", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);
      writeFileMock.mockResolvedValue(new Err("Failed to write file."));

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("errors when postRemove hook fails", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postRemove: ["exit 1"],
          },
        })
      );
      runHooksMock
        .mockResolvedValueOnce(new Ok(null)) // preRemove
        .mockResolvedValueOnce(new Err("Hook failed")); // postRemove

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when postRemove hook fails after template reset", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check"]);
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./src/icons.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
          hooks: {
            postRemove: ["exit 1"],
          },
        })
      );
      runHooksMock
        .mockResolvedValueOnce(new Ok(null)) // preRemove
        .mockResolvedValueOnce(new Err("Hook failed")); // postRemove

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check"], options);

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
    it("removes icons in order provided", async () => {
      // Need more icons than we're removing so it doesn't reset to template
      getExistingIconNamesMock.mockReturnValue([
        "Home",
        "Check",
        "Star",
        "Extra",
      ]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Home", "Check", "Star"], options);

      expect(removeIconMock).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        "Home"
      );
      expect(removeIconMock).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        "Check"
      );
      expect(removeIconMock).toHaveBeenNthCalledWith(
        3,
        expect.any(String),
        "Star"
      );
    });

    it("chains removeIcon calls with updated content", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check", "Home", "Star"]);
      removeIconMock
        .mockReturnValueOnce("after removing first")
        .mockReturnValueOnce("after removing second");

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check", "Home"], options);

      // Second call should receive result of first call
      expect(removeIconMock).toHaveBeenNthCalledWith(
        2,
        "after removing first",
        "Home"
      );
    });

    it("writes final content after all removals", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check", "Home", "Star"]);
      removeIconMock
        .mockReturnValueOnce("intermediate")
        .mockReturnValueOnce("final content");

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check", "Home"], options);

      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringContaining("icons.tsx"),
        "final content"
      );
    });

    it("logs success for each removed icon", async () => {
      getExistingIconNamesMock.mockReturnValue([
        "Icon1",
        "Icon2",
        "Icon3",
        "Icon4",
        "Icon5",
      ]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Icon1", "Icon2", "Icon3"], options);

      expect(loggerSuccessSpy).toHaveBeenCalledTimes(3);
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Icon1");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Icon2");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Icon3");
    });

    it("validates all icons before removing any", async () => {
      getExistingIconNamesMock.mockReturnValue(["Check", "Home"]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check", "NotFound"], options);

      // Should fail validation before any removal
      expect(result.isErr()).toBe(true);
      expect(removeIconMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it("uses config output path for icons file", async () => {
      loadConfigMock.mockResolvedValue(
        new Ok({
          $schema: "https://denji-docs.vercel.app/configuration_schema.json",
          output: "./lib/icons/index.tsx",
          framework: "react",
          typescript: true,
          trackSource: true,
        })
      );

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check"], options);

      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringContaining("lib/icons/index.tsx"),
        expect.any(String)
      );
    });

    it("handles single icon removal that empties the file", async () => {
      getExistingIconNamesMock.mockReturnValue(["OnlyIcon"]);

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["OnlyIcon"], options);

      expect(result.isOk()).toBe(true);
      // Uses real getIconsTemplate
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("export const Icons = {}")
      );
    });
  });
});
