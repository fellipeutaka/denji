import { describe, expect, it } from "bun:test";
import { svelteStrategy } from "./strategy";

describe("Svelte Strategy", () => {
  describe("metadata", () => {
    it("has correct name", () => {
      expect(svelteStrategy.name).toBe("svelte");
    });

    it("has correct file extensions", () => {
      expect(svelteStrategy.fileExtensions).toEqual({
        typescript: ".svelte",
        javascript: ".svelte",
      });
    });

    it("does not support ref", () => {
      expect(svelteStrategy.supportsRef).toBe(false);
    });

    it("prefers folder output type", () => {
      expect(svelteStrategy.preferredOutputType).toBe("folder");
    });

    it("returns svelte as config key", () => {
      expect(svelteStrategy.getConfigKey()).toBe("svelte");
    });
  });

  describe("getIconsTemplate", () => {
    it("generates TypeScript template with Icons object", () => {
      const template = svelteStrategy.getIconsTemplate({
        typescript: true,
        frameworkOptions: {},
      });

      expect(template).toContain("export const Icons = {} as const");
      expect(template).toContain("export type IconName = keyof typeof Icons");
    });

    it("generates JavaScript template (no types)", () => {
      const template = svelteStrategy.getIconsTemplate({
        typescript: false,
        frameworkOptions: {},
      });

      expect(template).toContain("export const Icons = {}");
      expect(template).not.toContain("type IconName");
    });
  });

  describe("transformSvg", () => {
    const baseSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

    it("generates a .svelte component with script and markup", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        { typescript: true }
      );

      expect(result).toContain("<script");
      expect(result).toContain("</script>");
      expect(result).toContain("<svg");
      expect(result).toContain("</svg>");
    });

    it("uses typed $props() in TypeScript mode", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        { typescript: true }
      );

      expect(result).toContain('<script lang="ts">');
      expect(result).toContain(
        'import type { SVGAttributes } from "svelte/elements"'
      );
      expect(result).toContain("type $$Props = SVGAttributes<SVGSVGElement>");
      expect(result).toContain("let { ...props }: $$Props = $props()");
    });

    it("uses untyped $props() in JavaScript mode", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        { typescript: false }
      );

      expect(result).toContain("<script>");
      expect(result).not.toContain('lang="ts"');
      expect(result).toContain("let { ...props } = $props()");
      expect(result).not.toContain("import type");
    });

    it("spreads props on the svg element", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        { typescript: true }
      );

      expect(result).toContain("{...props}");
    });

    it("adds aria-hidden when a11y is hidden", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          a11y: "hidden",
          trackSource: false,
        },
        { typescript: true }
      );

      expect(result).toContain('aria-hidden="true"');
    });

    it("adds role=img and aria-label when a11y is img", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          a11y: "img",
          trackSource: false,
        },
        { typescript: true }
      );

      expect(result).toContain('role="img"');
      expect(result).toContain('aria-label="Check"');
    });

    it("adds title element when a11y is title", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          a11y: "title",
          trackSource: false,
        },
        { typescript: true }
      );

      expect(result).toContain("<title>Check</title>");
    });

    it("adds data-icon attribute when trackSource is true", async () => {
      const result = await svelteStrategy.transformSvg(
        baseSvg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: true,
        },
        { typescript: true }
      );

      expect(result).toContain('data-icon="lucide:check"');
    });

    it("preserves kebab-case attributes", async () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke="currentColor" fill="none"/></svg>';

      const result = await svelteStrategy.transformSvg(
        svg,
        {
          iconName: "lucide:check",
          componentName: "Check",
          trackSource: false,
        },
        { typescript: true }
      );

      expect(result).toContain("stroke-width");
      expect(result).toContain("stroke-linecap");
    });
  });

  describe("getTypesFileContent", () => {
    it("generates types file with SVGAttributes import", () => {
      const content = svelteStrategy.getTypesFileContent?.();

      expect(content).toContain(
        'import type { SVGAttributes } from "svelte/elements"'
      );
      expect(content).toContain(
        "export type IconProps = SVGAttributes<SVGSVGElement>"
      );
    });
  });

  describe("isForwardRefEnabled", () => {
    it("always returns false", () => {
      expect(svelteStrategy.isForwardRefEnabled({})).toBe(false);
    });
  });

  describe("promptOptions", () => {
    it("returns empty object", async () => {
      const options = await svelteStrategy.promptOptions({});
      expect(options).toEqual({});
    });
  });
});
