import { describe, expect, it, mock } from "bun:test";
import { Err, Ok } from "~/utils/result";
import {
  createImportDeps,
  createMockFs,
  createMockLogger,
} from "./__tests__/test-utils";
import { ImportCommand } from "./import";

const jsonManifest = JSON.stringify({
  version: 1,
  framework: "react",
  output: "./src/icons.tsx",
  icons: [
    { name: "Home", source: "mdi:home" },
    { name: "Check", source: "lucide:check" },
  ],
});

const jsonManifestMissingSource = JSON.stringify({
  version: 1,
  framework: "react",
  output: "./src/icons.tsx",
  icons: [{ name: "Home", source: "mdi:home" }, { name: "NoSource" }],
});

const txtContent = "mdi:home\nlucide:check\n";

describe("ImportCommand", () => {
  // ============================================
  // JSON MANIFEST INPUT
  // ============================================

  describe("JSON manifest input", () => {
    it("adds icons from source fields in JSON manifest", async () => {
      const mockRunAddFileMode = mock(() => Promise.resolve(new Ok(null)));
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(jsonManifest))),
        }),
        runAddFileMode: mockRunAddFileMode,
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.json",
      });

      expect(result.isOk()).toBe(true);
      expect(mockRunAddFileMode).toHaveBeenCalledTimes(1);
      const ctx = (mockRunAddFileMode.mock.calls as unknown[][])[0]?.[0] as {
        icons: string[];
      };
      expect(ctx.icons).toEqual(["mdi:home", "lucide:check"]);
    });

    it("skips icons without source and warns", async () => {
      const mockWarn = mock(() => undefined);
      const mockRunAddFileMode = mock(() => Promise.resolve(new Ok(null)));
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok(jsonManifestMissingSource))
          ),
        }),
        logger: createMockLogger({ warn: mockWarn }),
        runAddFileMode: mockRunAddFileMode,
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.json",
      });

      expect(result.isOk()).toBe(true);
      expect(mockWarn).toHaveBeenCalledWith(
        "Skipped 1 icon(s) with no source tracking info."
      );
      const ctx = (mockRunAddFileMode.mock.calls as unknown[][])[0]?.[0] as {
        icons: string[];
      };
      expect(ctx.icons).toEqual(["mdi:home"]);
    });

    it("returns error on invalid JSON", async () => {
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok("not-json"))),
        }),
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.json",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to parse JSON");
      }
    });
  });

  // ============================================
  // TEXT FILE INPUT
  // ============================================

  describe("text file input", () => {
    it("adds icons from txt file lines", async () => {
      const mockRunAddFileMode = mock(() => Promise.resolve(new Ok(null)));
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(txtContent))),
        }),
        runAddFileMode: mockRunAddFileMode,
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.txt",
      });

      expect(result.isOk()).toBe(true);
      const ctx = (mockRunAddFileMode.mock.calls as unknown[][])[0]?.[0] as {
        icons: string[];
      };
      expect(ctx.icons).toEqual(["mdi:home", "lucide:check"]);
    });

    it("trims whitespace and skips empty lines", async () => {
      const mockRunAddFileMode = mock(() => Promise.resolve(new Ok(null)));
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("  mdi:home  \n\n  lucide:check\n"))
          ),
        }),
        runAddFileMode: mockRunAddFileMode,
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.txt",
      });

      expect(result.isOk()).toBe(true);
      const ctx = (mockRunAddFileMode.mock.calls as unknown[][])[0]?.[0] as {
        icons: string[];
      };
      expect(ctx.icons).toEqual(["mdi:home", "lucide:check"]);
    });
  });

  // ============================================
  // VALIDATION
  // ============================================

  describe("icon validation", () => {
    it("skips icons without prefix and warns", async () => {
      const mockWarn = mock(() => undefined);
      const mockRunAddFileMode = mock(() => Promise.resolve(new Ok(null)));
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("mdi:home\ninvalid-icon\nlucide:check\n"))
          ),
        }),
        logger: createMockLogger({ warn: mockWarn }),
        runAddFileMode: mockRunAddFileMode,
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.txt",
      });

      expect(result.isOk()).toBe(true);
      expect(mockWarn).toHaveBeenCalledWith(
        "Skipped 1 invalid icon(s) (missing prefix): invalid-icon"
      );
      const ctx = (mockRunAddFileMode.mock.calls as unknown[][])[0]?.[0] as {
        icons: string[];
      };
      expect(ctx.icons).toEqual(["mdi:home", "lucide:check"]);
    });

    it("returns error when all icons are invalid", async () => {
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() =>
            Promise.resolve(new Ok("not-valid\nanother-bad\n"))
          ),
        }),
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.txt",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("No valid icons to import");
      }
    });
  });

  // ============================================
  // DRY RUN
  // ============================================

  describe("--dry-run flag", () => {
    it("forwards dry-run to AddCommand", async () => {
      const mockRunAddFileMode = mock(() => Promise.resolve(new Ok(null)));
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(txtContent))),
        }),
        runAddFileMode: mockRunAddFileMode,
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.txt",
        dryRun: true,
      });

      expect(result.isOk()).toBe(true);
      const opts = (mockRunAddFileMode.mock.calls as unknown[][])[0]?.[0] as {
        options: { dryRun?: boolean };
      };
      expect(opts.options.dryRun).toBe(true);
    });
  });

  // ============================================
  // ERROR PATHS
  // ============================================

  describe("error paths", () => {
    it("returns error when file cannot be read", async () => {
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Err("File not found"))),
        }),
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.txt",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Failed to read file");
      }
    });

    it("returns error when no file and stdin is a TTY", async () => {
      const originalIsTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", {
        value: true,
        writable: true,
      });

      const deps = createImportDeps();
      const command = new ImportCommand(deps);

      const result = await command.run({ cwd: "/test/project" });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("No input provided");
      }

      Object.defineProperty(process.stdin, "isTTY", {
        value: originalIsTTY,
        writable: true,
      });
    });

    it("propagates AddCommand errors", async () => {
      const deps = createImportDeps({
        fs: createMockFs({
          readFile: mock(() => Promise.resolve(new Ok(txtContent))),
        }),
        runAddFileMode: mock(() =>
          Promise.resolve(new Err("Icon not found on Iconify"))
        ),
      });
      const command = new ImportCommand(deps);

      const result = await command.run({
        cwd: "/test/project",
        file: "icons.txt",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("Icon not found on Iconify");
      }
    });
  });
});
