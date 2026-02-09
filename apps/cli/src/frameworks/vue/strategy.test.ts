import { describe, expect, it } from "bun:test";
import { vueStrategy } from "./strategy";

describe("Vue Strategy", () => {
  describe("metadata", () => {
    it("has correct name", () => {
      expect(vueStrategy.name).toBe("vue");
    });

    it("has correct file extensions", () => {
      expect(vueStrategy.fileExtensions).toEqual({
        typescript: ".ts",
        javascript: ".js",
      });
    });

    it("does not support forwardRef", () => {
      expect(vueStrategy.supportsRef).toBe(false);
    });

    it("returns vue as config key", () => {
      expect(vueStrategy.getConfigKey()).toBe("vue");
    });
  });

  describe("getIconsTemplate", () => {
    it("generates TypeScript template with Vue imports", () => {
      const template = vueStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: { syntax: "h" },
      });

      expect(template).toContain(
        'import { h, type FunctionalComponent, type SVGAttributes } from "vue"'
      );
      expect(template).toContain("export type IconProps = SVGAttributes");
      expect(template).toContain(
        "export type Icon = FunctionalComponent<IconProps>"
      );
      expect(template).toContain(
        "export const Icons = {} as const satisfies Record<string, Icon>"
      );
      expect(template).toContain("export type IconName = keyof typeof Icons");
    });

    it("generates JavaScript template with h import only", () => {
      const template = vueStrategy.getIconsTemplate({
        typescript: false,
        frameworkOptions: { syntax: "h" },
      });

      expect(template).toContain('import { h } from "vue"');
      expect(template).toContain("export const Icons = {}");
      expect(template).not.toContain("type IconProps");
      expect(template).not.toContain("FunctionalComponent");
    });
  });

  describe("transformSvg", () => {
    it("transforms simple SVG to h() function", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain("Home: (props) => h(");
      expect(result).toContain('h("svg"');
      expect(result).toContain("...props");
      expect(result).toContain('h("path"');
    });

    it("adds aria-hidden attribute when a11y is hidden", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          a11y: "hidden",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain('"aria-hidden": "true"');
    });

    it("adds role=img and aria-label when a11y is img", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          a11y: "img",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain('role: "img"');
      expect(result).toContain('"aria-label": "Home"');
    });

    it("adds data-icon attribute when trackSource is true", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          trackSource: true,
        },
        { syntax: "h" }
      );

      expect(result).toContain('"data-icon": "mdi:home"');
    });

    it("handles SVG with multiple children", async () => {
      // Use real SVG paths that SVGO won't strip
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/><circle cx="12" cy="12" r="10"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:test",
          componentName: "Test",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain('h("path"');
      expect(result).toContain('h("circle"');
    });

    it("preserves kebab-case attributes", async () => {
      // Use path with stroke attributes that won't be stripped
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke="currentColor" fill="none"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:test",
          componentName: "Test",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain('"stroke-width"');
      expect(result).toContain('"stroke-linecap"');
    });

    it("handles SVG with nested non-self-closing elements", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g clip-path="url(#a)"><path d="M10 20v-6h4v6"/><circle cx="12" cy="12" r="10"/></g><defs><clipPath id="a"><path d="M0 0h24v24H0z"/></clipPath></defs></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:clip",
          componentName: "Clip",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain('h("g"');
      expect(result).toContain('h("defs"');
      expect(result).toContain('h("clipPath"');
      expect(result).toContain('h("path"');
    });

    it("handles SVG with grouped children", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g opacity=".5"><path d="M10 20v-6h4v6"/><circle cx="12" cy="12" r="10"/></g></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:group",
          componentName: "Group",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain('h("g"');
      expect(result).toContain('opacity: ".5"');
      expect(result).toContain('h("path"');
      expect(result).toContain('h("circle"');
    });

    it("adds title element when a11y is title (no children)", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:dot",
          componentName: "Dot",
          a11y: "title",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain('h("title"');
      expect(result).toContain('"Dot"');
    });

    it("generates folder mode output", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          outputMode: "folder",
          trackSource: false,
        },
        { syntax: "h" }
      );

      expect(result).toContain("export function Home");
      expect(result).toContain("FunctionalComponent");
      expect(result).toContain('h("svg"');
    });

    it("spreads props after default attributes", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1"/></svg>';

      const result = await vueStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:test",
          componentName: "Test",
          trackSource: false,
        },
        { syntax: "h" }
      );

      // Props should come after default attrs so users can override
      const propsIndex = result.indexOf("...props");
      const viewBoxIndex = result.indexOf("viewBox");
      expect(propsIndex).toBeGreaterThan(viewBoxIndex);
    });
  });

  describe("isForwardRefEnabled", () => {
    it("always returns false", () => {
      expect(vueStrategy.isForwardRefEnabled({ syntax: "h" })).toBe(false);
      expect(vueStrategy.isForwardRefEnabled({})).toBe(false);
    });
  });

  describe("promptOptions", () => {
    it("returns default syntax option", async () => {
      const options = await vueStrategy.promptOptions({});
      expect(options).toEqual({ syntax: "h" });
    });
  });
});
