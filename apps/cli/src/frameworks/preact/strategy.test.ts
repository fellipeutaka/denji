import { describe, expect, it } from "bun:test";
import { preactStrategy } from "./strategy";

describe("Preact Strategy", () => {
  describe("metadata", () => {
    it("has correct name", () => {
      expect(preactStrategy.name).toBe("preact");
    });

    it("has correct file extensions", () => {
      expect(preactStrategy.fileExtensions).toEqual({
        typescript: ".tsx",
        javascript: ".jsx",
      });
    });

    it("supports forwardRef", () => {
      expect(preactStrategy.supportsRef).toBe(true);
    });

    it("returns preact as config key", () => {
      expect(preactStrategy.getConfigKey()).toBe("preact");
    });
  });

  describe("getIconsTemplate", () => {
    it("generates TypeScript template with preact/compat types", () => {
      const template = preactStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: { forwardRef: false },
      });

      expect(template).toContain(
        'import type * as preact from "preact/compat"'
      );
      expect(template).toContain(
        'export type IconProps = preact.ComponentProps<"svg">'
      );
      expect(template).toContain(
        "export type Icon = (props: IconProps) => preact.JSX.Element"
      );
      expect(template).toContain(
        "export const Icons = {} as const satisfies Record<string, Icon>"
      );
      expect(template).not.toContain("ForwardRefExoticComponent");
    });

    it("generates TypeScript template with forwardRef type", () => {
      const template = preactStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: { forwardRef: true },
      });

      expect(template).toContain(
        "preact.ForwardRefExoticComponent<IconProps & preact.RefAttributes<SVGSVGElement>>"
      );
      expect(template).not.toContain(
        "(props: IconProps) => preact.JSX.Element"
      );
    });

    it("generates JavaScript template (no types)", () => {
      const template = preactStrategy.getIconsTemplate({
        typescript: false,
        frameworkOptions: { forwardRef: false },
      });

      expect(template).toContain("export const Icons = {}");
      expect(template).not.toContain("import type * as preact");
      expect(template).not.toContain("type IconProps");
    });
  });

  describe("transformSvg", () => {
    it("transforms SVG to Preact JSX component", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          trackSource: false,
        },
        { forwardRef: false }
      );

      expect(result).toContain("Home: (props) => (");
      expect(result).toContain("<svg");
      expect(result).toContain("{...props}");
    });

    it("transforms SVG with forwardRef", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          trackSource: false,
        },
        { forwardRef: true }
      );

      expect(result).toContain(
        "Home: forwardRef<SVGSVGElement, IconProps>((props, ref) => ("
      );
      expect(result).toContain("ref={ref}");
    });

    it("adds aria-hidden when a11y is hidden", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          a11y: "hidden",
          trackSource: false,
        },
        { forwardRef: false }
      );

      expect(result).toContain('aria-hidden="true"');
    });

    it("adds data-icon attribute when trackSource is true", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          trackSource: true,
        },
        { forwardRef: false }
      );

      expect(result).toContain('data-icon="mdi:home"');
    });
  });

  describe("getImports", () => {
    it("returns forwardRef import from preact/compat when enabled", () => {
      const imports = preactStrategy.getImports({ forwardRef: true });
      expect(imports).toEqual(['import { forwardRef } from "preact/compat";']);
    });

    it("returns empty array when forwardRef disabled", () => {
      const imports = preactStrategy.getImports({ forwardRef: false });
      expect(imports).toEqual([]);
    });
  });

  describe("isForwardRefEnabled", () => {
    it("returns true when forwardRef is true", () => {
      expect(preactStrategy.isForwardRefEnabled({ forwardRef: true })).toBe(
        true
      );
    });

    it("returns false when forwardRef is false", () => {
      expect(preactStrategy.isForwardRefEnabled({ forwardRef: false })).toBe(
        false
      );
    });
  });

  describe("getForwardRefImportSource", () => {
    it("returns preact/compat", () => {
      expect(preactStrategy.getForwardRefImportSource()).toBe("preact/compat");
    });
  });
});
