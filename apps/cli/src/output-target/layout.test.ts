import { describe, expect, it } from "bun:test";
import { createOutputLayout } from "./layout";

describe("OutputLayout", () => {
  it("captures framework persistence policy without exposing strategy objects", () => {
    const layout = createOutputLayout({
      componentExtension: ".tsx",
      emptyFileContent: "export const Icons = {} as const;\n",
      isManagedEntry: ({ content }) => content.includes('data-icon="'),
      barrel: {
        emptyContent: "export const Icons = {};\n",
        extension: ".ts",
        fileName: "index",
        render: (names) =>
          names.map((name) => `export { ${name} };`).join("\n"),
      },
      typesFile: {
        content: "export type IconProps = unknown;\n",
        fileName: "types.ts",
      },
    });

    expect(layout.componentExtension).toBe(".tsx");
    expect(layout.emptyFileContent).toBe("export const Icons = {} as const;\n");
    expect(layout.barrel).toEqual({
      emptyContent: "export const Icons = {};\n",
      extension: ".ts",
      fileName: "index",
      render: expect.any(Function),
    });
    expect(layout.typesFile).toEqual({
      content: "export type IconProps = unknown;\n",
      fileName: "types.ts",
    });
    expect(
      layout.isManagedEntry({
        content: '<svg data-icon="mdi:home" />',
        name: "Home",
      })
    ).toBe(true);
    expect(
      layout.isManagedEntry({ content: "export const Home = {}", name: "Home" })
    ).toBe(false);
  });

  it("keeps the policy immutable after it is resolved", () => {
    const layout = createOutputLayout({
      componentExtension: ".svelte",
      emptyFileContent: "export const Icons = {};\n",
      isManagedEntry: () => true,
    });

    expect(Object.isFrozen(layout)).toBe(true);
    expect(Object.isFrozen(layout.barrel)).toBe(true);
    expect(Object.isFrozen(layout.typesFile)).toBe(true);
  });
});
