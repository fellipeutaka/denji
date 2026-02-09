import { describe, expect, it } from "bun:test";
import { qwikStrategy } from "./strategy";

describe("Qwik Strategy", () => {
  describe("metadata", () => {
    it("has correct name", () => {
      expect(qwikStrategy.name).toBe("qwik");
    });

    it("has correct file extensions", () => {
      expect(qwikStrategy.fileExtensions).toEqual({
        typescript: ".tsx",
        javascript: ".jsx",
      });
    });

    it("supports ref (natively)", () => {
      expect(qwikStrategy.supportsRef).toBe(true);
    });

    it("returns qwik as config key", () => {
      expect(qwikStrategy.getConfigKey()).toBe("qwik");
    });
  });

  describe("getIconsTemplate", () => {
    it("generates TypeScript template with @builder.io/qwik types", () => {
      const template = qwikStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: {},
      });

      expect(template).toContain(
        'import type { PropsOf } from "@builder.io/qwik"'
      );
      expect(template).toContain('export type IconProps = PropsOf<"svg">');
      expect(template).toContain(
        "export type Icon = (props: IconProps) => JSX.Element"
      );
      expect(template).toContain(
        "export const Icons = {} as const satisfies Record<string, Icon>"
      );
      expect(template).toContain("export type IconName = keyof typeof Icons");
    });

    it("generates JavaScript template (no types)", () => {
      const template = qwikStrategy.getIconsTemplate({
        typescript: false,
        frameworkOptions: {},
      });

      expect(template).toContain("export const Icons = {}");
      expect(template).not.toContain("import type");
      expect(template).not.toContain("type IconProps");
    });
  });

  describe("transformSvg", () => {
    it("transforms SVG to Qwik component with props spread", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

      const result = await qwikStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          trackSource: false,
        },
        {}
      );

      expect(result).toContain("Home: (props) => (");
      expect(result).toContain("<svg");
      expect(result).toContain("{...props}");
    });

    it("preserves kebab-case attributes (native HTML)", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke="currentColor" fill="none"/></svg>';

      const result = await qwikStrategy.transformSvg(
        svg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        {}
      );

      // Qwik uses native HTML attributes (kebab-case)
      expect(result).toContain("stroke-width");
      expect(result).toContain("stroke-linecap");
    });

    it("adds aria-hidden when a11y is hidden", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await qwikStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          a11y: "hidden",
          trackSource: false,
        },
        {}
      );

      expect(result).toContain('aria-hidden="true"');
    });

    it("adds role=img and aria-label when a11y is img", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await qwikStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          a11y: "img",
          trackSource: false,
        },
        {}
      );

      expect(result).toContain('role="img"');
      expect(result).toContain('aria-label="Home"');
    });

    it("adds data-icon attribute when trackSource is true", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await qwikStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          trackSource: true,
        },
        {}
      );

      expect(result).toContain('data-icon="mdi:home"');
    });

    it("adds title element when a11y is title", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await qwikStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "HomeIcon",
          a11y: "title",
          trackSource: false,
        },
        {}
      );

      expect(result).toContain("<title>Home Icon</title>");
    });

    it("generates folder mode output with component$", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await qwikStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          outputMode: "folder",
          trackSource: false,
        },
        {}
      );

      expect(result).toContain('import { component$ } from "@builder.io/qwik"');
      expect(result).toContain(
        'import type { PropsOf } from "@builder.io/qwik"'
      );
      expect(result).toContain("export const Home = component$<IconProps>");
      expect(result).toContain("{...props}");
    });
  });

  describe("isForwardRefEnabled", () => {
    it("always returns false (Qwik refs work natively)", () => {
      expect(qwikStrategy.isForwardRefEnabled({})).toBe(false);
    });
  });

  describe("promptOptions", () => {
    it("returns empty object (no framework-specific options)", async () => {
      const options = await qwikStrategy.promptOptions({});
      expect(options).toEqual({});
    });
  });
});
