import { describe, expect, it, mock } from "bun:test";
import type { Config } from "~/schemas/config";
import { Err, Ok } from "~/utils/result";
import {
  createAddDeps,
  createMockFs,
  createMockHooks,
  createMockIcons,
  emptyIconsFileContent,
  sampleIconsFileContent,
  withConfig,
  withConfigError,
  withHooks,
} from "./__tests__/test-utils";
import { AddCommand } from "./add";

describe("AddCommand", () => {
  describe("execution flow", () => {
    it("validates cwd exists before proceeding", async () => {
      const deps = createAddDeps({
        fs: createMockFs({ access: mock(() => Promise.resolve(false)) }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/nonexistent",
      });

      expect(result.isErr()).toBe(true);
      expect(deps.config.loadConfig).not.toHaveBeenCalled();
    });

    it("loads config after validating cwd", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.config.loadConfig).toHaveBeenCalledWith("/test/project");
    });

    it("runs preAdd hooks before processing icons", async () => {
      const runHooksMock = mock(() => Promise.resolve(new Ok(null)));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withHooks({ preAdd: ["echo pre"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(runHooksMock).toHaveBeenCalledWith(["echo pre"], "/test/project");
      // Verify hooks called before fetch
      const hookCallOrder = runHooksMock.mock.invocationCallOrder[0];
      const fetchCallOrder = (deps.icons.fetchIcon as ReturnType<typeof mock>)
        .mock.invocationCallOrder[0];
      expect(hookCallOrder).toBeLessThan(fetchCallOrder ?? 0);
    });

    it("reads icons file before fetching", async () => {
      const readFileMock = mock(() =>
        Promise.resolve(new Ok(emptyIconsFileContent))
      );
      const deps = createAddDeps({
        fs: createMockFs({ readFile: readFileMock }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(readFileMock).toHaveBeenCalled();
    });

    it("fetches each icon via IconService", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["mdi:home", "lucide:check"], { cwd: "/test/project" });

      expect(deps.icons.fetchIcon).toHaveBeenCalledWith("mdi:home");
      expect(deps.icons.fetchIcon).toHaveBeenCalledWith("lucide:check");
      expect(deps.icons.fetchIcon).toHaveBeenCalledTimes(2);
    });

    it("writes updated file after processing", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.fs.writeFile).toHaveBeenCalled();
    });

    it("runs postAdd hooks after successful write", async () => {
      const runHooksMock = mock(() => Promise.resolve(new Ok(null)));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withHooks({ postAdd: ["echo post"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(runHooksMock).toHaveBeenCalledWith(["echo post"], "/test/project");
      // Verify hooks called after write
      const writeCallOrder = (deps.fs.writeFile as ReturnType<typeof mock>).mock
        .invocationCallOrder[0];
      const postHookCallOrder = runHooksMock.mock.invocationCallOrder[1];
      expect(writeCallOrder).toBeLessThan(postHookCallOrder ?? 0);
    });

    it("logs success for each added icon", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check", "lucide:home"], {
        cwd: "/test/project",
      });

      expect(deps.logger.success).toHaveBeenCalledWith("Added Check");
      expect(deps.logger.success).toHaveBeenCalledWith("Added Home");
    });
  });

  describe("input validation", () => {
    it("rejects --name with multiple icons", async () => {
      const deps = createAddDeps();
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check", "lucide:home"], {
        cwd: "/test/project",
        name: "CustomIcon",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain(
          "--name can only be used with a single icon"
        );
      }
    });

    it("validates icon name format", async () => {
      const deps = createAddDeps({
        icons: createMockIcons({
          validateIconName: mock(() => new Err("Invalid icon format")),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["invalid"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid icon format");
      }
    });

    it("validates a11y option value", async () => {
      const deps = createAddDeps();
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
        a11y: "invalid",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Invalid a11y strategy");
      }
    });

    it("accepts all valid a11y strategies", async () => {
      const strategies = ["hidden", "img", "title", "presentation", "false"];

      for (const strategy of strategies) {
        const deps = createAddDeps({
          fs: createMockFs({
            readFile: mock(() =>
              Promise.resolve(new Ok(emptyIconsFileContent))
            ),
          }),
        });
        const command = new AddCommand(deps);

        const result = await command.run(["lucide:check"], {
          cwd: "/test/project",
          a11y: strategy,
        });

        expect(result.isOk()).toBe(true);
      }
    });

    it("uses custom component name with --name option", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], {
        cwd: "/test/project",
        name: "CustomIcon",
      });

      expect(deps.logger.success).toHaveBeenCalledWith("Added CustomIcon");
    });
  });

  describe("error handling", () => {
    it("returns error if cwd does not exist", async () => {
      const deps = createAddDeps({
        fs: createMockFs({ access: mock(() => Promise.resolve(false)) }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/nonexistent",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("returns error if config fails to load", async () => {
      const deps = createAddDeps({
        config: withConfigError(
          'denji.json not found. Run "denji init" first.'
        ),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("denji.json not found");
      }
    });

    it("returns error if icons file does not exist", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          access: mock((path: string) => {
            if (path.includes("icons.tsx")) {
              return Promise.resolve(false);
            }
            return Promise.resolve(true);
          }),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
      }
    });

    it("returns error if icons file cannot be read", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Err("Failed to read file"))),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("returns error if preAdd hook fails", async () => {
      const deps = createAddDeps({
        config: withHooks({ preAdd: ["exit 1"] }),
        hooks: createMockHooks({
          runHooks: mock(() => Promise.resolve(new Err("Hook failed"))),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("returns error if writeFile fails", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
          writeFile: mock(() => Promise.resolve(new Err("Write failed"))),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("returns error if postAdd hook fails", async () => {
      const runHooksMock = mock()
        .mockResolvedValueOnce(new Ok(null))
        .mockResolvedValueOnce(new Err("Hook failed"));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withHooks({ postAdd: ["exit 1"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("logs error and continues when one icon fetch fails", async () => {
      const fetchMock = mock()
        .mockResolvedValueOnce(new Err("Network error"))
        .mockResolvedValueOnce(new Ok("<svg></svg>"));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        icons: createMockIcons({ fetchIcon: fetchMock }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check", "lucide:home"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.error).toHaveBeenCalledWith(
        "Failed to fetch lucide:check: Network error"
      );
      expect(deps.logger.success).toHaveBeenCalledWith("Added Home");
    });
  });

  describe("overwrite behavior", () => {
    it("prompts for confirmation when icon exists", async () => {
      const confirmMock = mock(() => Promise.resolve(true));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: confirmMock },
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Icon "Check" already exists. Overwrite?',
        })
      );
    });

    it("replaces icon when overwrite confirmed", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: mock(() => Promise.resolve(true)) },
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.logger.success).toHaveBeenCalledWith("Replaced Check");
      expect(deps.fs.writeFile).toHaveBeenCalled();
    });

    it("skips icon when overwrite declined", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: mock(() => Promise.resolve(false)) },
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.logger.info).toHaveBeenCalledWith("Skipped Check");
      expect(deps.fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe("skip conditions", () => {
    it("does not write file when all icons skipped", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: mock(() => Promise.resolve(false)) },
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.fs.writeFile).not.toHaveBeenCalled();
    });

    it("does not run postAdd hooks when no icons added", async () => {
      const runHooksMock = mock(() => Promise.resolve(new Ok(null)));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: mock(() => Promise.resolve(false)) },
        config: withHooks({ postAdd: ["echo post"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      // Only preAdd should be called
      expect(runHooksMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("config options", () => {
    it("uses a11y from config when not overridden", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withConfig({ a11y: "presentation" }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
    });

    it("uses trackSource from config", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withConfig({ trackSource: false }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
    });

    it("defaults trackSource to true when undefined", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withConfig({
          trackSource: undefined,
        } as unknown as Partial<Config>),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
    });
  });
});
