import { describe, expect, it, mock } from "bun:test";
import { Err, Ok } from "~/utils/result";
import {
  createMockFs,
  createMockHooks,
  createRemoveDeps,
  withConfig,
  withConfigError,
  withHooks,
} from "./__tests__/test-utils";
import { RemoveCommand } from "./remove";

describe("RemoveCommand", () => {
  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("removes a single icon", async () => {
      const threeIconsContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
  Star: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(threeIconsContent))),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(deps.fs.writeFile).toHaveBeenCalled();
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Check");
    });

    it("removes multiple icons", async () => {
      const threeIconsContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
  Star: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(threeIconsContent))),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check", "Home"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Check");
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Home");
    });

    it("resets to template when removing all icons", async () => {
      const deps = createRemoveDeps();
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check", "Home"], {
        cwd: "/test/project",
      });

      expect(result.isOk()).toBe(true);
      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("icons.tsx"),
        expect.stringContaining("export const Icons = {}")
      );
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Check");
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Home");
    });

    it("runs preRemove hooks before removing", async () => {
      const deps = createRemoveDeps({
        config: withHooks({ preRemove: ["echo pre"] }),
      });
      const command = new RemoveCommand(deps);

      await command.run(["Check"], { cwd: "/test/project" });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo pre"],
        "/test/project"
      );
    });

    it("runs postRemove hooks after removing", async () => {
      const deps = createRemoveDeps({
        config: withHooks({ postRemove: ["echo post"] }),
      });
      const command = new RemoveCommand(deps);

      await command.run(["Check"], { cwd: "/test/project" });

      expect(deps.hooks.runHooks).toHaveBeenCalledWith(
        ["echo post"],
        "/test/project"
      );
    });

    it("runs postRemove hooks after resetting to template", async () => {
      const singleIconContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(singleIconContent))),
        }),
        config: withHooks({ postRemove: ["echo post"] }),
      });
      const command = new RemoveCommand(deps);

      await command.run(["Check"], { cwd: "/test/project" });

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
      const deps = createRemoveDeps({
        fs: createMockFs({ access: mock(() => Promise.resolve(false)) }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/nonexistent" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Directory does not exist");
      }
    });

    it("errors when config cannot be loaded", async () => {
      const deps = createRemoveDeps({
        config: withConfigError(
          'denji.json not found. Run "denji init" first.'
        ),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("denji.json not found");
      }
    });

    it("errors when icons file does not exist", async () => {
      const deps = createRemoveDeps({
        fs: createMockFs({
          access: mock((path: string) => {
            if (path.includes("icons.tsx")) {
              return Promise.resolve(false);
            }
            return Promise.resolve(true);
          }),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
        expect(result.error).toContain('Run "denji init" first');
      }
    });

    it("errors when icons file cannot be read", async () => {
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Err("Failed to read file."))
          ),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("errors when icon does not exist", async () => {
      const deps = createRemoveDeps();
      const command = new RemoveCommand(deps);

      const result = await command.run(["NotFound"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icon(s) not found: NotFound");
      }
    });

    it("errors when multiple icons do not exist", async () => {
      const deps = createRemoveDeps();
      const command = new RemoveCommand(deps);

      const result = await command.run(["NotFound1", "NotFound2"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icon(s) not found");
        expect(result.error).toContain("NotFound1");
        expect(result.error).toContain("NotFound2");
      }
    });

    it("errors when some icons exist and some do not", async () => {
      const deps = createRemoveDeps();
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check", "NotFound"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icon(s) not found: NotFound");
      }
    });

    it("errors when preRemove hook fails", async () => {
      const deps = createRemoveDeps({
        config: withHooks({ preRemove: ["exit 1"] }),
        hooks: createMockHooks({
          runHooks: mock(() => Promise.resolve(new Err("Hook failed"))),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when writeFile fails", async () => {
      const threeIconsContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
  Home: (props) => (<svg {...props}></svg>),
  Star: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(threeIconsContent))),
          writeFile: mock(() =>
            Promise.resolve(new Err("Failed to write file."))
          ),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("errors when writeFile fails during template reset", async () => {
      const singleIconContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(singleIconContent))),
          writeFile: mock(() =>
            Promise.resolve(new Err("Failed to write file."))
          ),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write icons file");
      }
    });

    it("errors when postRemove hook fails", async () => {
      const runHooksMock = mock<typeof deps.hooks.runHooks>()
        .mockResolvedValueOnce(new Ok(null)) // preRemove
        .mockResolvedValueOnce(new Err("Hook failed")); // postRemove
      const deps = createRemoveDeps({
        config: withHooks({ postRemove: ["exit 1"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Hook failed");
      }
    });

    it("errors when postRemove hook fails after template reset", async () => {
      const singleIconContent = `export const Icons = {
  Check: (props) => (<svg {...props}></svg>),
} as const;
`;
      const runHooksMock = mock<typeof deps.hooks.runHooks>()
        .mockResolvedValueOnce(new Ok(null)) // preRemove
        .mockResolvedValueOnce(new Err("Hook failed")); // postRemove
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(singleIconContent))),
        }),
        config: withHooks({ postRemove: ["exit 1"] }),
        hooks: createMockHooks({ runHooks: runHooksMock }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check"], { cwd: "/test/project" });

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
      const fourIconsContent = `export const Icons = {
  Home: (props) => (<svg {...props}></svg>),
  Check: (props) => (<svg {...props}></svg>),
  Star: (props) => (<svg {...props}></svg>),
  Extra: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(fourIconsContent))),
        }),
      });
      const command = new RemoveCommand(deps);

      await command.run(["Home", "Check", "Star"], { cwd: "/test/project" });

      expect(deps.logger.success).toHaveBeenCalledWith("Removed Home");
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Check");
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Star");
    });

    it("logs success for each removed icon", async () => {
      const fiveIconsContent = `export const Icons = {
  Icon1: (props) => (<svg {...props}></svg>),
  Icon2: (props) => (<svg {...props}></svg>),
  Icon3: (props) => (<svg {...props}></svg>),
  Icon4: (props) => (<svg {...props}></svg>),
  Icon5: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(fiveIconsContent))),
        }),
      });
      const command = new RemoveCommand(deps);

      await command.run(["Icon1", "Icon2", "Icon3"], { cwd: "/test/project" });

      expect(deps.logger.success).toHaveBeenCalledTimes(3);
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Icon1");
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Icon2");
      expect(deps.logger.success).toHaveBeenCalledWith("Removed Icon3");
    });

    it("validates all icons before removing any", async () => {
      const deps = createRemoveDeps();
      const command = new RemoveCommand(deps);

      const result = await command.run(["Check", "NotFound"], {
        cwd: "/test/project",
      });

      expect(result.isErr()).toBe(true);
      expect(deps.fs.writeFile).not.toHaveBeenCalled();
    });

    it("uses config output path for icons file", async () => {
      const deps = createRemoveDeps({
        config: withConfig({ output: "./lib/icons/index.tsx" }),
      });
      const command = new RemoveCommand(deps);

      await command.run(["Check"], { cwd: "/test/project" });

      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("lib/icons/index.tsx"),
        expect.any(String)
      );
    });

    it("handles single icon removal that empties the file", async () => {
      const singleIconContent = `export const Icons = {
  OnlyIcon: (props) => (<svg {...props}></svg>),
} as const;
`;
      const deps = createRemoveDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(singleIconContent))),
        }),
      });
      const command = new RemoveCommand(deps);

      const result = await command.run(["OnlyIcon"], { cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("export const Icons = {}")
      );
    });
  });
});
