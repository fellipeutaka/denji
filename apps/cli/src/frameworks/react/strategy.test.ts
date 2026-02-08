import { describe, expect, it } from "bun:test";
import { reactStrategy } from "./strategy";

describe("React Strategy", () => {
  describe("metadata", () => {
    it("has correct name", () => {
      expect(reactStrategy.name).toBe("react");
    });

    it("has correct file extensions", () => {
      expect(reactStrategy.fileExtensions).toEqual({
        typescript: ".tsx",
        javascript: ".jsx",
      });
    });

    it("supports forwardRef", () => {
      expect(reactStrategy.supportsRef).toBe(true);
    });

    it("returns react as config key", () => {
      expect(reactStrategy.getConfigKey()).toBe("react");
    });
  });

  describe("getIconsTemplate", () => {
    it("generates TypeScript template without forwardRef", () => {
      const template = reactStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: { forwardRef: false },
      });

      expect(template).toContain(
        'export type IconProps = React.ComponentProps<"svg">'
      );
      expect(template).toContain(
        "export type Icon = (props: IconProps) => React.JSX.Element"
      );
      expect(template).toContain(
        "export const Icons = {} as const satisfies Record<string, Icon>"
      );
      expect(template).toContain("export type IconName = keyof typeof Icons");
      expect(template).not.toContain("ForwardRefExoticComponent");
    });

    it("generates TypeScript template with forwardRef", () => {
      const template = reactStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: { forwardRef: true },
      });

      expect(template).toContain(
        'export type IconProps = React.ComponentProps<"svg">'
      );
      expect(template).toContain(
        'React.ForwardRefExoticComponent<IconProps & React.ComponentRef<"svg">>'
      );
      expect(template).not.toContain("(props: IconProps) => React.JSX.Element");
    });

    it("generates JavaScript template (no types)", () => {
      const template = reactStrategy.getIconsTemplate({
        typescript: false,
        frameworkOptions: { forwardRef: false },
      });

      expect(template).toContain("export const Icons = {}");
      expect(template).not.toContain("type IconProps");
      expect(template).not.toContain("type Icon");
    });
  });

  describe("transformSvg", () => {
    it("transforms SVG to React JSX component", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';

      const result = await reactStrategy.transformSvg(
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

      const result = await reactStrategy.transformSvg(
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

      const result = await reactStrategy.transformSvg(
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

    it("adds role=img and aria-label when a11y is img", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await reactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "Home",
          a11y: "img",
          trackSource: false,
        },
        { forwardRef: false }
      );

      expect(result).toContain('role="img"');
      expect(result).toContain('aria-label="Home"');
    });

    it("adds data-icon attribute when trackSource is true", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await reactStrategy.transformSvg(
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

    it("converts attributes to camelCase for JSX", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke="currentColor" fill="none"/></svg>';

      const result = await reactStrategy.transformSvg(
        svg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        { forwardRef: false }
      );

      expect(result).toContain("strokeWidth={2}");
      expect(result).toContain("strokeLinecap=");
      expect(result).not.toContain("stroke-width");
      expect(result).not.toContain("stroke-linecap");
    });

    it("generates standalone named export for folder mode", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

      const result = await reactStrategy.transformSvg(
        svg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
          outputMode: "folder",
        },
        { forwardRef: false }
      );

      expect(result).toContain(
        'import type { ComponentProps, JSX } from "react"'
      );
      expect(result).toContain('export type IconProps = ComponentProps<"svg">');
      expect(result).toContain(
        "export function Check(props: IconProps): JSX.Element"
      );
      expect(result).not.toContain("Check: (props) =>");
    });

    it("generates standalone named export with forwardRef for folder mode", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

      const result = await reactStrategy.transformSvg(
        svg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
          outputMode: "folder",
        },
        { forwardRef: true }
      );

      expect(result).toContain(
        'import { forwardRef, type ComponentProps, type ComponentRef } from "react"'
      );
      expect(result).toContain('export type IconProps = ComponentProps<"svg">');
      expect(result).toContain(
        "export const Check = forwardRef<SVGSVGElement, IconProps>"
      );
      expect(result).toContain("function Check(props, ref)");
      expect(result).toContain('Check.displayName = "Check"');
      expect(result).toContain("ref={ref}");
    });

    it("generates object property for file mode", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

      const result = await reactStrategy.transformSvg(
        svg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
          outputMode: "file",
        },
        { forwardRef: false }
      );

      expect(result).toContain("Check: (props) =>");
      expect(result).not.toContain("export function Check");
      expect(result).not.toContain("import");
    });
  });

  describe("getImports", () => {
    it("returns forwardRef import when enabled", () => {
      const imports = reactStrategy.getImports({ forwardRef: true });
      expect(imports).toEqual(['import { forwardRef } from "react";']);
    });

    it("returns empty array when forwardRef disabled", () => {
      const imports = reactStrategy.getImports({ forwardRef: false });
      expect(imports).toEqual([]);
    });
  });

  describe("isForwardRefEnabled", () => {
    it("returns true when forwardRef is true", () => {
      expect(reactStrategy.isForwardRefEnabled({ forwardRef: true })).toBe(
        true
      );
    });

    it("returns false when forwardRef is false", () => {
      expect(reactStrategy.isForwardRefEnabled({ forwardRef: false })).toBe(
        false
      );
    });

    it("returns false when forwardRef is undefined", () => {
      expect(reactStrategy.isForwardRefEnabled({})).toBe(false);
    });
  });

  describe("getForwardRefImportSource", () => {
    it("returns react", () => {
      expect(reactStrategy.getForwardRefImportSource()).toBe("react");
    });
  });
});
