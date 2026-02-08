import { describe, expect, it, mock } from "bun:test";
import { Ok } from "~/utils/result";
import { loadConfig } from "./config";

// Mock fs functions used by loadConfig
const { readFile: mockReadFile } = await (() => {
  const accessMock = mock(() => Promise.resolve(true));
  const readFileMock = mock(() => Promise.resolve(new Ok("{}")));

  mock.module("~/utils/fs", () => ({
    access: accessMock,
    readFile: readFileMock,
  }));

  return { readFile: readFileMock };
})();

function makeConfig(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    output: { type: "file", path: "./src/icons.tsx" },
    framework: "react",
    typescript: true,
    ...overrides,
  });
}

describe("loadConfig", () => {
  describe("output extension validation", () => {
    it("accepts react + .tsx", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(makeConfig({ framework: "react" }))
      );
      const result = await loadConfig("/test");
      expect(result.isOk()).toBe(true);
    });

    it("accepts react + .jsx when typescript is false", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "react",
            typescript: false,
            output: { type: "file", path: "./src/icons.jsx" },
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isOk()).toBe(true);
    });

    it("rejects react + .ts", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "react",
            output: { type: "file", path: "./src/icons.ts" },
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".ts"');
        expect(result.error).toContain('Use ".tsx"');
      }
    });

    it("accepts vue + .ts", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "vue",
            output: { type: "file", path: "./src/icons.ts" },
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isOk()).toBe(true);
    });

    it("rejects vue + .tsx", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "vue",
            output: { type: "file", path: "./src/icons.tsx" },
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".tsx"');
        expect(result.error).toContain('Use ".ts"');
      }
    });

    it("rejects svelte + file mode", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "svelte",
            output: { type: "file", path: "./src/icons.svelte" },
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain(
          "Svelte only supports folder output mode"
        );
      }
    });

    it("skips validation for folder mode", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "svelte",
            output: { type: "folder", path: "./src/icons" },
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isOk()).toBe(true);
    });

    it("skips validation for folder mode with .tsx path", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "svelte",
            output: { type: "folder", path: "./src/icons.tsx" },
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isOk()).toBe(true);
    });

    it("normalizes string output and validates", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "react",
            output: "./src/icons.tsx",
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isOk()).toBe(true);
    });

    it("rejects string output with wrong extension", async () => {
      mockReadFile.mockResolvedValueOnce(
        new Ok(
          makeConfig({
            framework: "react",
            output: "./src/icons.svelte",
          })
        )
      );
      const result = await loadConfig("/test");
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Invalid extension ".svelte"');
      }
    });
  });
});
