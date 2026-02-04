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
  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("adds a single icon", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.icons.fetchIcon).toHaveBeenCalledWith("lucide:check");
      expect(deps.fs.writeFile).toHaveBeenCalled();
      expect(deps.logger.success).toHaveBeenCalledWith("Added Check");
    });

    it("adds multiple icons", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check", "lucide:home"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.icons.fetchIcon).toHaveBeenCalledTimes(2);
      expect(deps.logger.success).toHaveBeenCalledWith("Added Check");
      expect(deps.logger.success).toHaveBeenCalledWith("Added Home");
    });

    it("uses custom name with --name option", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
        name: "CustomIcon",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.success).toHaveBeenCalledWith("Added CustomIcon");
    });

    it("overwrites existing icon when confirmed", async () => {
      const confirmMock = mock(() => Promise.resolve(true));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: confirmMock },
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
      expect(confirmMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Icon "Check" already exists. Overwrite?',
        })
      );
      expect(deps.logger.success).toHaveBeenCalledWith("Replaced Check");
    });

    it("skips existing icon when overwrite declined", async () => {
      const confirmMock = mock(() => Promise.resolve(false));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: confirmMock },
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.info).toHaveBeenCalledWith("Skipped Check");
      expect(deps.fs.writeFile).not.toHaveBeenCalled();
    });

    it("runs preAdd hooks before adding", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withHooks({ preAdd: ["echo pre"] }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo pre"],
        "/test/project"
      );
    });

    it("runs postAdd hooks after adding", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withHooks({ postAdd: ["echo post"] }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo post"],
        "/test/project"
      );
    });

    it("passes trackSource from config", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withConfig({ trackSource: false }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      // Framework strategy is called with the trackSource option
      expect(deps.fs.writeFile).toHaveBeenCalled();
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("errors when cwd does not exist", async () => {
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

    it("errors when --name used with multiple icons", async () => {
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

    it("errors when icon name is invalid", async () => {
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

    it("errors with invalid --a11y value", async () => {
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

    it("errors when config cannot be loaded", async () => {
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

    it("errors when preAdd hook fails", async () => {
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

    it("errors when icons file does not exist", async () => {
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
        expect(result.error).toContain('Run "denji init" first');
      }
    });

    it("errors when icons file cannot be read", async () => {
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

    it("logs error and continues when fetch fails for one icon", async () => {
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

    it("errors when writeFile fails", async () => {
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

    it("errors when postAdd hook fails", async () => {
      const runHooksMock = mock()
        .mockResolvedValueOnce(new Ok(null)) // preAdd
        .mockResolvedValueOnce(new Err("Hook failed")); // postAdd
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
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe("edge cases", () => {
    it("does not write file when all icons skipped", async () => {
      const confirmMock = mock(() => Promise.resolve(false));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: confirmMock },
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.fs.writeFile).not.toHaveBeenCalled();
    });

    it("does not run postAdd hooks when no icons added", async () => {
      const confirmMock = mock(() => Promise.resolve(false));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
        prompts: { confirm: confirmMock },
        config: withHooks({ postAdd: ["echo post"] }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      // postAdd should not be called because addedCount is 0
      expect(deps.hooks.runHooks).toHaveBeenCalledTimes(1); // only preAdd
    });

    it("handles mixed success and failure gracefully", async () => {
      const fetchMock = mock()
        .mockResolvedValueOnce(new Ok("<svg>1</svg>"))
        .mockResolvedValueOnce(new Err("Not found"))
        .mockResolvedValueOnce(new Ok("<svg>3</svg>"));
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        icons: createMockIcons({ fetchIcon: fetchMock }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(
        ["lucide:check", "lucide:missing", "lucide:home"],
        { cwd: "/test/project" }
      );

      expect(result.isOk()).toBe(true);
      expect(deps.logger.success).toHaveBeenCalledWith("Added Check");
      expect(deps.logger.error).toHaveBeenCalledWith(
        "Failed to fetch lucide:missing: Not found"
      );
      expect(deps.logger.success).toHaveBeenCalledWith("Added Home");
      expect(deps.fs.writeFile).toHaveBeenCalled();
    });

    it("uses config a11y when no override provided", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withConfig({ a11y: "presentation" }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      // The framework strategy receives the a11y option
      expect(deps.fs.writeFile).toHaveBeenCalled();
    });

    it("defaults trackSource to true when not in config", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
        config: withConfig({
          trackSource: undefined,
        } as unknown as Partial<Config>),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      expect(deps.fs.writeFile).toHaveBeenCalled();
    });

    it("tracks newly added icons to prevent duplicates in same batch", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check", "lucide:home"], {
        cwd: "/test/project",
      });

      // Both should be added successfully
      expect(deps.logger.success).toHaveBeenCalledWith("Added Check");
      expect(deps.logger.success).toHaveBeenCalledWith("Added Home");
      expect(deps.fs.writeFile).toHaveBeenCalled();
    });

    it("handles a11y: false string correctly", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      const result = await command.run(["lucide:check"], {
        cwd: "/test/project",
        a11y: "false",
      });

      expect(result.isOk()).toBe(true);
    });

    it("accepts all valid a11y strategies", async () => {
      const strategies = ["hidden", "img", "title", "presentation"];

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

    it("handles icons from different sources", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(emptyIconsFileContent))),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["mdi:home", "lucide:check", "heroicons:star"], {
        cwd: "/test/project",
      });

      expect(deps.icons.fetchIcon).toHaveBeenCalledWith("mdi:home");
      expect(deps.icons.fetchIcon).toHaveBeenCalledWith("lucide:check");
      expect(deps.icons.fetchIcon).toHaveBeenCalledWith("heroicons:star");
    });
  });

  // ============================================
  // FORWARDREF TESTS
  // ============================================

  describe("forwardRef option", () => {
    it("adds forwardRef import on first icon when Icons is empty and forwardRef enabled", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("export const Icons = {};"))
          ),
        }),
        config: withConfig({
          react: { forwardRef: true },
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      const writeCall = (deps.fs.writeFile as ReturnType<typeof mock>).mock
        .calls[0];
      expect(writeCall).toBeDefined();
      expect(writeCall?.[1]).toContain('import { forwardRef } from "react"');
    });

    it("does not add forwardRef import when Icons already has icons", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(
              new Ok(`import { forwardRef } from "react";

export const Icons = {
  Home: forwardRef<SVGSVGElement, IconProps>((props, ref) => (<svg ref={ref} {...props}></svg>)),
};`)
            )
          ),
        }),
        config: withConfig({
          react: { forwardRef: true },
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      const writeCall = (deps.fs.writeFile as ReturnType<typeof mock>).mock
        .calls[0];
      expect(writeCall).toBeDefined();
      // Should only have one import statement, not duplicated
      const content = writeCall?.[1] as string;
      const importCount = (content.match(/import { forwardRef }/g) || [])
        .length;
      expect(importCount).toBe(1);
    });

    it("does not add forwardRef import when forwardRef is disabled", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("export const Icons = {};"))
          ),
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      const writeCall = (deps.fs.writeFile as ReturnType<typeof mock>).mock
        .calls[0];
      expect(writeCall).toBeDefined();
      expect(writeCall?.[1]).not.toContain("import { forwardRef }");
    });
  });

  // ============================================
  // PREACT FRAMEWORK TESTS
  // ============================================

  describe("Preact framework", () => {
    it("adds forwardRef import from preact/compat when Preact and forwardRef enabled", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("export const Icons = {};"))
          ),
        }),
        config: withConfig({
          framework: "preact",
          preact: { forwardRef: true },
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      const writeCall = (deps.fs.writeFile as ReturnType<typeof mock>).mock
        .calls[0];
      expect(writeCall).toBeDefined();
      expect(writeCall?.[1]).toContain(
        'import { forwardRef } from "preact/compat"'
      );
    });

    it("does not add forwardRef import for Preact when forwardRef disabled", async () => {
      const deps = createAddDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("export const Icons = {};"))
          ),
        }),
        config: withConfig({
          framework: "preact",
        }),
      });
      const command = new AddCommand(deps);

      await command.run(["lucide:check"], { cwd: "/test/project" });

      const writeCall = (deps.fs.writeFile as ReturnType<typeof mock>).mock
        .calls[0];
      expect(writeCall).toBeDefined();
      expect(writeCall?.[1]).not.toContain("import { forwardRef }");
    });
  });
});
