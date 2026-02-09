import { describe, expect, it } from "bun:test";
import { solidStrategy } from "./strategy";

describe("Solid Strategy", () => {
  describe("metadata", () => {
    it("has correct name", () => {
      expect(solidStrategy.name).toBe("solid");
    });

    it("has correct file extensions", () => {
      expect(solidStrategy.fileExtensions).toEqual({
        typescript: ".tsx",
        javascript: ".jsx",
      });
    });

    it("supports ref (natively)", () => {
      expect(solidStrategy.supportsRef).toBe(true);
    });

    it("returns solid as config key", () => {
      expect(solidStrategy.getConfigKey()).toBe("solid");
    });
  });

  describe("getIconsTemplate", () => {
    it("generates TypeScript template with solid-js types", () => {
      const template = solidStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: {},
      });

      expect(template).toContain(
        'import type { ComponentProps, JSX } from "solid-js"'
      );
      expect(template).toContain(
        'export type IconProps = ComponentProps<"svg">'
      );
      expect(template).toContain(
        "export type Icon = (props: IconProps) => JSX.Element"
      );
      expect(template).toContain(
        "export const Icons = {} as const satisfies Record<string, Icon>"
      );
      expect(template).toContain("export type IconName = keyof typeof Icons");
    });

    it("generates JavaScript template (no types)", () => {
      const template = solidStrategy.getIconsTemplate({
        typescript: false,
        frameworkOptions: {},
      });

      expect(template).toContain("export const Icons = {}");
      expect(template).not.toContain("import type");
      expect(template).not.toContain("type IconProps");
    });
  });

  describe("transformSvg", () => {
    it("transforms SVG to Solid component with props spread", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

      const result = await solidStrategy.transformSvg(
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

      const result = await solidStrategy.transformSvg(
        svg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        {}
      );

      // Solid uses native HTML attributes (kebab-case)
      expect(result).toContain("stroke-width");
      expect(result).toContain("stroke-linecap");
    });

    it("adds aria-hidden when a11y is hidden", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await solidStrategy.transformSvg(
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

      const result = await solidStrategy.transformSvg(
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

      const result = await solidStrategy.transformSvg(
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

      const result = await solidStrategy.transformSvg(
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

    it("generates folder mode output", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await solidStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          outputMode: "folder",
          trackSource: false,
        },
        {}
      );

      expect(result).toContain("export function Home");
      expect(result).toContain("JSX.Element");
      expect(result).toContain("{...props}");
    });
  });

  describe("isForwardRefEnabled", () => {
    it("always returns false (Solid refs work natively)", () => {
      expect(solidStrategy.isForwardRefEnabled({})).toBe(false);
    });
  });

  describe("promptOptions", () => {
    it("returns empty object (no framework-specific options)", async () => {
      const options = await solidStrategy.promptOptions({});
      expect(options).toEqual({});
    });
  });
});
