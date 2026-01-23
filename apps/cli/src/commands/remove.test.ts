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
import { getExistingIconNames, removeIcon } from "~/utils/icons";
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
  removeIcon,
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

    // Default success implementations with realistic icons file content
    accessMock.mockResolvedValue(true);
    readFileMock.mockResolvedValue(
      new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
  Star: (props) => (<svg {...props}></svg>),
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
        forwardRef: false,
      })
    );
    runHooksMock.mockResolvedValue(new Ok(null));

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
      expect(writeFileMock).toHaveBeenCalled();
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Check");
    });

    it("removes multiple icons", async () => {
      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check", "Home"], options);

      expect(result.isOk()).toBe(true);
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Check");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Home");
    });

    it("resets to template when removing all icons", async () => {
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
} as const;
`)
      );

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check", "Home"], options);

      expect(result.isOk()).toBe(true);
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
          forwardRef: false,
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
          forwardRef: false,
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
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
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
          forwardRef: false,
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
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
} as const;
`)
      );
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
          forwardRef: false,
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
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
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
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  Home: (props) => (<svg {...props}></svg>),
  Check: (props) => (<svg {...props}></svg>),
  Star: (props) => (<svg {...props}></svg>),
  Extra: (props) => (<svg {...props}></svg>),
} as const;
`)
      );

      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Home", "Check", "Star"], options);

      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Home");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Check");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Star");
    });

    it("chains removeIcon calls correctly", async () => {
      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check", "Home"], options);

      // Real removeIcon will be called with updated content each time
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Check");
      expect(loggerSuccessSpy).toHaveBeenCalledWith("Removed Home");
    });

    it("writes final content after all removals", async () => {
      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      await command.run(["Check", "Home"], options);

      // Verify writeFile was called with content that no longer contains removed icons
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringContaining("icons.tsx"),
        expect.not.stringContaining("Check:")
      );
    });

    it("logs success for each removed icon", async () => {
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
      const options: RemoveOptions = {
        cwd: "/test/project",
      };

      const result = await command.run(["Check", "NotFound"], options);

      // Should fail validation before any removal
      expect(result.isErr()).toBe(true);
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
          forwardRef: false,
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
      readFileMock.mockResolvedValue(
        new Ok(`export const Icons = {
  OnlyIcon: (props) => (<svg {...props}></svg>),
} as const;
`)
      );

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
