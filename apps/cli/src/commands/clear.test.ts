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
import {
  createClearDeps,
  createMockFs,
  createMockHooks,
  emptyIconsFileContent,
  withConfigError,
  withHooks,
} from "./__tests__/test-utils";
import { ClearCommand } from "./clear";

describe("ClearCommand", () => {
  let processExitSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock process.exit for prompt cancellation tests
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
    it("clears all icons with --yes flag", async () => {
      const deps = createClearDeps();
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

      expect(result.isOk()).toBe(true);
      expect(deps.prompts.confirm).not.toHaveBeenCalled();
      expect(deps.fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it("prompts for confirmation without --yes flag", async () => {
      const deps = createClearDeps();
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: false });

      expect(result.isOk()).toBe(true);
      expect(deps.prompts.confirm).toHaveBeenCalledTimes(1);
      expect(deps.fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it("resets icons file to template", async () => {
      const deps = createClearDeps();
      const command = new ClearCommand(deps);

      await command.run({ cwd: "/test/project", yes: true });

      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("icons.tsx"),
        expect.stringContaining("export const Icons = {}")
      );
    });

    it("returns early when no icons to remove", async () => {
      const deps = createClearDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.info).toHaveBeenCalledWith("No icons to remove");
      expect(deps.fs.writeFile).not.toHaveBeenCalled();
    });

    it("runs preClear hooks before clearing", async () => {
      const deps = createClearDeps({
        config: withHooks({ preClear: ["echo pre"] }),
      });
      const command = new ClearCommand(deps);

      await command.run({ cwd: "/test/project", yes: true });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo pre"],
        "/test/project"
      );
    });

    it("runs postClear hooks after clearing", async () => {
      const deps = createClearDeps({
        config: withHooks({ postClear: ["echo post"] }),
      });
      const command = new ClearCommand(deps);

      await command.run({ cwd: "/test/project", yes: true });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo post"],
        "/test/project"
      );
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("errors when cwd does not exist", async () => {
      const deps = createClearDeps({
        fs: createMockFs({ access: mock(() => Promise.resolve(false)) }),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/nonexistent", yes: true });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when config cannot be loaded", async () => {
      const deps = createClearDeps({
        config: withConfigError(
          'denji.json not found. Run "denji init" first.'
        ),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("denji.json not found");
      }
    });

    it("errors when icons file does not exist", async () => {
      const deps = createClearDeps({
        fs: createMockFs({
          access: mock((path: string) => {
            if (path.includes("icons.tsx")) {
              return Promise.resolve(false);
            }
            return Promise.resolve(true);
          }),
        }),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
      }
    });

    it("errors when icons file cannot be read", async () => {
      const deps = createClearDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Err("Failed to read file."))
          ),
        }),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("errors when preClear hook fails", async () => {
      const deps = createClearDeps({
        config: withHooks({ preClear: ["exit 1"] }),
        hooks: createMockHooks({
          runHooks: mock(() => Promise.resolve(new Err("Hook failed"))),
        }),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when writeFile fails", async () => {
      const deps = createClearDeps({
        fs: createMockFs({
          writeFile: mock(() =>
            Promise.resolve(new Err("Failed to write file."))
          ),
        }),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("errors when postClear hook fails", async () => {
      const runHooksMock = mock<typeof deps.hooks.runHooks>()
        .mockResolvedValueOnce(new Ok(null)) // preClear
        .mockResolvedValueOnce(new Err("Hook failed")); // postClear
      const deps = createClearDeps({
        config: withHooks({ postClear: ["exit 1"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new ClearCommand(deps);

      const result = await command.run({ cwd: "/test/project", yes: true });

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
    it("shows correct icon count in confirmation message", async () => {
      const fiveIconsContent = `export const Icons = {
  Icon1: (props) => (<svg {...props}></svg>),
  Icon2: (props) => (<svg {...props}></svg>),
  Icon3: (props) => (<svg {...props}></svg>),
  Icon4: (props) => (<svg {...props}></svg>),
  Icon5: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createClearDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(fiveIconsContent))),
        }),
      });
      const command = new ClearCommand(deps);

      await command.run({ cwd: "/test/project", yes: false });

      expect(deps.prompts.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Remove all 5 icon(s)?",
        })
      );
    });

    it("handles single icon correctly", async () => {
      const singleIconContent = `export const Icons = {
  SingleIcon: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createClearDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(singleIconContent))),
        }),
      });
      const command = new ClearCommand(deps);

      await command.run({ cwd: "/test/project", yes: false });

      expect(deps.prompts.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Remove all 1 icon(s)?",
        })
      );
    });
  });
});
