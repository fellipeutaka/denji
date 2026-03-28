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
  createExportDeps,
  createMockFs,
  sampleIconsFileContent,
  withConfig,
  withConfigError,
} from "./__tests__/test-utils";
import { ExportCommand } from "./export";

const sampleIconsWithSource = `export const Icons = {
  Check: (props) => (<svg data-icon="lucide:check" {...props}></svg>),
  Home: (props) => (<svg data-icon="mdi:home" {...props}></svg>),
} as const;
`;

describe("ExportCommand", () => {
  let consoleLogSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleLogSpy = spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // ============================================
  // SUCCESS PATHS
  // ============================================

  describe("success paths", () => {
    it("outputs manifest JSON to stdout when no --output given", async () => {
      const deps = createExportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsWithSource))),
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const printed = JSON.parse(
        (consoleLogSpy.mock.calls as unknown[][])[0]?.[0] as string
      );
      expect(printed.version).toBe(1);
      expect(printed.framework).toBe("react");
      expect(printed.icons).toHaveLength(2);
      expect(printed.icons[0]).toEqual({
        name: "Check",
        source: "lucide:check",
      });
      expect(printed.icons[1]).toEqual({ name: "Home", source: "mdi:home" });
    });

    it("includes source field only when icon has data-icon attribute", async () => {
      const deps = createExportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsFileContent))),
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      const printed = JSON.parse(
        (consoleLogSpy.mock.calls as unknown[][])[0]?.[0] as string
      );
      // sampleIconsFileContent has no data-icon attributes
      expect(printed.icons[0]).toEqual({ name: "Check" });
      expect(printed.icons[1]).toEqual({ name: "Home" });
    });

    it("writes to specified file path when --output path is given", async () => {
      const mockWriteFile = mock(() => Promise.resolve(new Ok(null)));
      const deps = createExportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsWithSource))),
          writeFile: mockWriteFile,
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "my-icons.json",
      });

      expect(result.isOk()).toBe(true);
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const [writePath] = mockWriteFile.mock.calls[0] as unknown as [
        string,
        string,
      ];
      expect(writePath).toContain("my-icons.json");
    });

    it("writes to denji-export.json when --output flag is given without a value", async () => {
      const mockWriteFile = mock(() => Promise.resolve(new Ok(null)));
      const deps = createExportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsWithSource))),
          writeFile: mockWriteFile,
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: true,
      });

      expect(result.isOk()).toBe(true);
      const [writePath] = mockWriteFile.mock.calls[0] as unknown as [
        string,
        string,
      ];
      expect(writePath).toContain("denji-export.json");
    });

    it("exports correct framework from config", async () => {
      const deps = createExportDeps({
        config: withConfig({ framework: "vue" }),
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsWithSource))),
        }),
      });
      const command = new ExportCommand(deps);

      await command.run({ cwd: "/test/project" });

      const printed = JSON.parse(
        (consoleLogSpy.mock.calls as unknown[][])[0]?.[0] as string
      );
      expect(printed.framework).toBe("vue");
    });

    it("exports empty icons array when no icons in file", async () => {
      const deps = createExportDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("export const Icons = {} as const;\n"))
          ),
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      const printed = JSON.parse(
        (consoleLogSpy.mock.calls as unknown[][])[0]?.[0] as string
      );
      expect(printed.icons).toHaveLength(0);
    });

    it("dispatches to runFolderMode when output type is folder", async () => {
      const mockFolderMode = mock(() => Promise.resolve(new Ok(null)));
      const deps = createExportDeps({
        config: withConfig({
          output: { type: "folder", path: "./src/icons" },
        }),
        runFolderMode: mockFolderMode,
      });
      const command = new ExportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isOk()).toBe(true);
      expect(mockFolderMode).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("returns error when config not found", async () => {
      const deps = createExportDeps({
        config: withConfigError("Config not found"),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
    });

    it("returns error when icons file not found", async () => {
      let callCount = 0;
      const deps = createExportDeps({
        fs: createMockFs({
          // cwd access returns true, icons file access returns false
          access: mock(() => Promise.resolve(callCount++ === 0)),
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icons file not found");
      }
    });

    it("returns error when reading icons file fails", async () => {
      const deps = createExportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Err("Permission denied"))),
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read icons file");
      }
    });

    it("returns error when writing export file fails", async () => {
      const deps = createExportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(sampleIconsWithSource))),
          writeFile: mock(() => Promise.resolve(new Err("Disk full"))),
        }),
      });
      const command = new ExportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        output: "out.json",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to write export file");
      }
    });
  });
});
