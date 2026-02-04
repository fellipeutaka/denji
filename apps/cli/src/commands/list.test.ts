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
  createListDeps,
  createMockFs,
  createMockHooks,
  emptyIconsFileContent,
  withConfig,
  withConfigError,
  withHooks,
} from "./__tests__/test-utils";
import { ListCommand } from "./list";

describe("ListCommand", () => {
  let consoleInfoSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleInfoSpy = spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("lists icons in formatted output", async () => {
      const deps = createListDeps();
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.success).toHaveBeenCalledWith(
        "Found 2 icon(s) in ./src/icons.tsx"
      );
      expect(deps.logger.info).toHaveBeenCalledWith("Icons:");
      expect(deps.logger.info).toHaveBeenCalledWith("  • Check");
      expect(deps.logger.info).toHaveBeenCalledWith("  • Home");
    });

    it("outputs JSON when --json flag is set", async () => {
      const deps = createListDeps();
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project", json: true });

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
      const deps = createListDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.info).toHaveBeenCalledWith(
        "No icons found in ./src/icons.tsx"
      );
      expect(deps.logger.success).not.toHaveBeenCalled();
    });

    it("outputs empty JSON when no icons found with --json", async () => {
      const deps = createListDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project", json: true });

      expect(result.isOk()).toBe(true);
      const jsonOutput = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(jsonOutput).toEqual({
        count: 0,
        output: "./src/icons.tsx",
        icons: [],
      });
    });

    it("runs preList hooks before listing", async () => {
      const deps = createListDeps({
        config: withHooks({ preList: ["echo pre"] }),
      });
      const command = new ListCommand(deps);

      await command.run({ cwd: "/test/project" });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo pre"],
        "/test/project"
      );
    });

    it("runs postList hooks after listing", async () => {
      const deps = createListDeps({
        config: withHooks({ postList: ["echo post"] }),
      });
      const command = new ListCommand(deps);

      await command.run({ cwd: "/test/project" });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo post"],
        "/test/project"
      );
    });

    it("runs postList hooks after JSON output", async () => {
      const deps = createListDeps({
        config: withHooks({ postList: ["echo post"] }),
      });
      const command = new ListCommand(deps);

      await command.run({ cwd: "/test/project", json: true });

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
      const deps = createListDeps({
        fs: createMockFs({ access: mock(() => Promise.resolve(false)) }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/nonexistent" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when config cannot be loaded", async () => {
      const deps = createListDeps({
        config: withConfigError(
          'denji.json not found. Run "denji init" first.'
        ),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("denji.json not found");
      }
    });

    it("errors when icons file does not exist", async () => {
      const deps = createListDeps({
        fs: createMockFs({
          access: mock((path: string) => {
            if (path.includes("icons.tsx")) {
              return Promise.resolve(false);
            }
            return Promise.resolve(true);
          }),
        }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
        expect(result.error).toContain('Run "denji init" first');
      }
    });

    it("errors when icons file cannot be read", async () => {
      const deps = createListDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Err("Failed to read file."))
          ),
        }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("errors when preList hook fails", async () => {
      const deps = createListDeps({
        config: withHooks({ preList: ["exit 1"] }),
        hooks: createMockHooks({
          runHooks: mock(() => Promise.resolve(new Err("Hook failed"))),
        }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when postList hook fails", async () => {
      const runHooksMock = mock<typeof deps.hooks.runHooks>()
        .mockResolvedValueOnce(new Ok(null)) // preList
        .mockResolvedValueOnce(new Err("Hook failed")); // postList
      const deps = createListDeps({
        config: withHooks({ postList: ["exit 1"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when postList hook fails with JSON output", async () => {
      const runHooksMock = mock<typeof deps.hooks.runHooks>()
        .mockResolvedValueOnce(new Ok(null)) // preList
        .mockResolvedValueOnce(new Err("Hook failed")); // postList
      const deps = createListDeps({
        config: withHooks({ postList: ["exit 1"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project", json: true });

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
      const singleIconContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createListDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(singleIconContent))),
        }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.success).toHaveBeenCalledWith(
        "Found 1 icon(s) in ./src/icons.tsx"
      );
    });

    it("handles many icons", async () => {
      const iconEntries = Array.from(
        { length: 100 },
        (_, i) => `  Icon${i}: (props) => (<svg {...props}></svg>)`
      ).join(",\n");
      const manyIconsContent = `export const Icons = {
${iconEntries},
} as const;
`;
      const deps = createListDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(manyIconsContent))),
        }),
      });
      const command = new ListCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.success).toHaveBeenCalledWith(
        "Found 100 icon(s) in ./src/icons.tsx"
      );
      // "Icons:" + 100 icons
      expect(deps.logger.info).toHaveBeenCalledTimes(101);
    });

    it("uses config output path in messages", async () => {
      const deps = createListDeps({
        config: withConfig({ output: "./lib/components/icons.tsx" }),
      });
      const command = new ListCommand(deps);

      await command.run({ cwd: "/test/project" });

      expect(deps.logger.success).toHaveBeenCalledWith(
        "Found 2 icon(s) in ./lib/components/icons.tsx"
      );
    });

    it("includes config output in JSON response", async () => {
      const deps = createListDeps({
        config: withConfig({ output: "./custom/path/icons.tsx" }),
      });
      const command = new ListCommand(deps);

      await command.run({ cwd: "/test/project", json: true });

      const jsonOutput = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      expect(jsonOutput.output).toBe("./custom/path/icons.tsx");
    });

    it("does not log formatted output with --json", async () => {
      const deps = createListDeps();
      const command = new ListCommand(deps);

      await command.run({ cwd: "/test/project", json: true });

      expect(deps.logger.success).not.toHaveBeenCalled();
      expect(deps.logger.info).not.toHaveBeenCalled();
    });

    it("runs postList hooks even when no icons found", async () => {
      const deps = createListDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withHooks({ postList: ["echo done"] }),
      });
      const command = new ListCommand(deps);

      await command.run({ cwd: "/test/project" });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo done"],
        "/test/project"
      );
    });
  });
});
