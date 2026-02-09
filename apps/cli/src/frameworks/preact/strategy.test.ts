import { describe, expect, it, spyOn } from "bun:test";
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

  describe("transformSvg error handling", () => {
    it("throws error when passing invalid SVG", () => {
      const invalidSvg = "not an svg";

      expect(
        preactStrategy.transformSvg(
          invalidSvg,
          {
            iconName: "test:invalid",
            componentName: "Invalid",
            trackSource: false,
          },
          { forwardRef: false }
        )
      ).rejects.toThrow();
    });

    it("throws error with specific message when SVG extraction fails", async () => {
      // Spy on the transform function to return invalid JSX without SVG tags
      const svgrCore = await import("@svgr/core");
      const transformSpy = spyOn(svgrCore, "transform").mockResolvedValue(
        "const Icon = () => <div>Invalid</div>;"
      );

      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      expect(
        preactStrategy.transformSvg(
          svg,
          {
            iconName: "test:invalid",
            componentName: "Invalid",
            trackSource: false,
          },
          { forwardRef: false }
        )
      ).rejects.toThrow("Failed to extract SVG from SVGR output");

      // Restore original function
      transformSpy.mockRestore();
    });
  });

  describe("transformSvg with title mode", () => {
    it("adds title element when a11y is title", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "HomeIcon",
          a11y: "title",
          trackSource: false,
        },
        { forwardRef: false }
      );

      expect(result).toContain("<title>Home Icon</title>");
    });

    it("adds title element with forwardRef when a11y is title", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "HomeIcon",
          a11y: "title",
          trackSource: false,
        },
        { forwardRef: true }
      );

      expect(result).toContain("<title>Home Icon</title>");
      expect(result).toContain("ref={ref}");
    });
  });

  describe("transformSvg folder mode", () => {
    it("generates standalone named export for folder mode", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

      const result = await preactStrategy.transformSvg(
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
        'import type { ComponentProps, JSX } from "preact"'
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

      const result = await preactStrategy.transformSvg(
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
        'import { forwardRef, type ComponentProps, type ComponentRef } from "preact/compat"'
      );
      expect(result).toContain('export type IconProps = ComponentProps<"svg">');
      expect(result).toContain(
        "export const Check = forwardRef<SVGSVGElement, IconProps>"
      );
      expect(result).toContain("function Check(props, ref)");
      expect(result).toContain('Check.displayName = "Check"');
      expect(result).toContain("ref={ref}");
    });

    it("adds title element in folder mode when a11y is title", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "HomeIcon",
          a11y: "title",
          trackSource: false,
          outputMode: "folder",
        },
        { forwardRef: false }
      );

      expect(result).toContain("<title>Home Icon</title>");
      expect(result).toContain("export function HomeIcon");
    });

    it("adds title element in folder mode with forwardRef when a11y is title", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6"/></svg>';

      const result = await preactStrategy.transformSvg(
        svg,
        {
          iconName: "mdi:home",
          componentName: "HomeIcon",
          a11y: "title",
          trackSource: false,
          outputMode: "folder",
        },
        { forwardRef: true }
      );

      expect(result).toContain("<title>Home Icon</title>");
      expect(result).toContain("export const HomeIcon = forwardRef");
      expect(result).toContain("ref={ref}");
    });
  });

  describe("promptOptions", () => {
    it("uses provided forwardRef value from context", async () => {
      const result = await preactStrategy.promptOptions({
        forwardRef: true,
      });

      expect(result).toEqual({ forwardRef: true });
    });

    it("uses provided false forwardRef value from context", async () => {
      const result = await preactStrategy.promptOptions({
        forwardRef: false,
      });

      expect(result).toEqual({ forwardRef: false });
    });
  });
});
