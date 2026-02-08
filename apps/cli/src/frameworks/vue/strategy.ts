import { eta } from "~/utils/eta";
import { getA11yAttrs, optimizeSvg, toReadableName } from "~/utils/svg";
import type {
  FrameworkStrategy,
  TemplateConfig,
  TransformSvgOptions,
} from "../types";
import { type VueOptions, vueOptionsSchema } from "./schema";

const ICONS_TEMPLATE = `<% if (it.typescript) { -%>
import { h, type FunctionalComponent, type SVGAttributes } from "vue";

export type IconProps = SVGAttributes;
export type Icon = FunctionalComponent<IconProps>;

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
<% } else { -%>
import { h } from "vue";

export const Icons = {};
<% } -%>
`;

eta.loadTemplate("@vue/icons", ICONS_TEMPLATE);

function getIconsTemplate(config: TemplateConfig): string {
  return eta.render("@vue/icons", {
    typescript: config.typescript,
  });
}

// Regex patterns at top level for performance
const ATTR_REGEX = /([a-zA-Z-:]+)="([^"]*)"/g;
const OPENING_TAG_REGEX = /^<(\w+)([^>]*)>/;
const ELEMENT_MATCH_REGEX = /^<(\w+)([^>]*?)(\/)?>|^<(\w+)([^>]*)>/;
const SVG_H_CALL_REGEX = /h\("svg", \{([^}]*)\}/;
const CHILDREN_ARRAY_REGEX = /\], \[/;
const TRAILING_CLOSE_REGEX = /\}\)$/;

/**
 * Parse SVG attributes from opening tag
 */
function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = new RegExp(ATTR_REGEX.source, "g");
  let match = regex.exec(tag);
  while (match !== null) {
    const key = match[1];
    const value = match[2];
    if (key && value !== undefined) {
      attrs[key] = value;
    }
    match = regex.exec(tag);
  }
  return attrs;
}

/**
 * Format attributes object for h() call
 */
function formatAttrsObject(attrs: Record<string, string>): string {
  const entries = Object.entries(attrs);
  if (entries.length === 0) {
    return "{}";
  }

  const formatted = entries.map(([key, value]) => {
    // Quote keys with special characters
    const needsQuotes = key.includes("-") || key.includes(":");
    const quotedKey = needsQuotes ? `"${key}"` : key;
    return `${quotedKey}: "${value}"`;
  });

  return `{ ${formatted.join(", ")} }`;
}

/**
 * Find matching closing tag index
 */
function findMatchingCloseTag(content: string, tagName: string): number {
  let depth = 0;
  const openRegex = new RegExp(`<${tagName}(?:\\s|>)`, "g");
  const closeRegex = new RegExp(`</${tagName}>`, "g");

  let pos = 0;
  while (pos < content.length) {
    openRegex.lastIndex = pos;
    closeRegex.lastIndex = pos;

    const openMatch = openRegex.exec(content);
    const closeMatch = closeRegex.exec(content);

    if (!closeMatch) {
      return -1;
    }

    if (!openMatch || closeMatch.index < openMatch.index) {
      if (depth === 0) {
        return closeMatch.index;
      }
      depth--;
      pos = closeMatch.index + closeMatch[0].length;
    } else {
      // Check if it's self-closing
      const tagEnd = content.indexOf(">", openMatch.index);
      if (tagEnd !== -1 && content[tagEnd - 1] === "/") {
        pos = tagEnd + 1;
      } else {
        depth++;
        pos = tagEnd + 1;
      }
    }
  }
  return -1;
}

/**
 * Process a single SVG element and convert to h() call
 */
function processElement(content: string): string {
  // Match opening tag with attributes
  const tagMatch = content.match(OPENING_TAG_REGEX);
  if (!tagMatch) {
    return '""';
  }

  const fullMatch = tagMatch[0];
  const tagName = tagMatch[1];
  const attrsString = tagMatch[2] ?? "";
  const attrs = parseAttributes(attrsString);

  // Check if self-closing
  const isSelfClosing =
    attrsString.trimEnd().endsWith("/") ||
    content.trim() === fullMatch ||
    content.match(new RegExp(`^<${tagName}[^>]*/>`));

  if (isSelfClosing || !content.includes(`</${tagName}>`)) {
    // Self-closing tag
    const attrsObj = formatAttrsObject(attrs);
    return `h("${tagName}", ${attrsObj})`;
  }

  // Find children content
  const closeTagIndex = content.lastIndexOf(`</${tagName}>`);
  const childrenContent = content.slice(fullMatch.length, closeTagIndex);

  // Parse children elements
  const children = parseChildren(childrenContent);

  const attrsObj = formatAttrsObject(attrs);
  if (children.length === 0) {
    return `h("${tagName}", ${attrsObj})`;
  }
  return `h("${tagName}", ${attrsObj}, [${children.join(", ")}])`;
}

/**
 * Parse children elements from content
 */
function parseChildren(content: string): string[] {
  const children: string[] = [];
  let remaining = content.trim();

  while (remaining.length > 0) {
    // Match next element
    const elementMatch = remaining.match(ELEMENT_MATCH_REGEX);
    if (!elementMatch) {
      break;
    }

    const tagName = elementMatch[1] ?? elementMatch[4] ?? "";
    const isSelfClosing =
      elementMatch[3] === "/" || elementMatch[0].endsWith("/>");

    if (isSelfClosing) {
      const attrs = parseAttributes(elementMatch[0]);
      children.push(`h("${tagName}", ${formatAttrsObject(attrs)})`);
      remaining = remaining.slice(elementMatch[0].length).trim();
    } else {
      // Find matching closing tag
      const closeTag = `</${tagName}>`;
      const closeIndex = findMatchingCloseTag(remaining, tagName);
      if (closeIndex === -1) {
        break;
      }

      const fullElement = remaining.slice(0, closeIndex + closeTag.length);
      children.push(processElement(fullElement));
      remaining = remaining.slice(closeIndex + closeTag.length).trim();
    }
  }

  return children;
}

/**
 * Convert SVG string to Vue h() function call
 */
function svgToH(svg: string): string {
  return processElement(svg.trim());
}

/**
 * Transform SVG to Vue h() function component
 */
function transformSvg(
  svg: string,
  options: TransformSvgOptions
): Promise<string> {
  const { a11y, trackSource, iconName, componentName } = options;

  // Optimize SVG with SVGO (keeps kebab-case attributes)
  const optimized = optimizeSvg(svg);

  // Build extra attributes to inject
  const extraAttrs: Record<string, string> = getA11yAttrs(a11y, componentName);

  if (trackSource && iconName) {
    extraAttrs["data-icon"] = iconName;
  }

  // For title mode, we need to handle it specially in the h() output
  let titleElement = "";
  if (a11y === "title") {
    const readableName = toReadableName(componentName);
    titleElement = `h("title", {}, "${readableName}"), `;
  }

  // Convert SVG to h() call
  let hCall = svgToH(optimized);

  // Inject props spread and extra attrs into the h() call
  const extraAttrsStr = Object.entries(extraAttrs)
    .map(([k, v]) => {
      const needsQuotes = k.includes("-") || k.includes(":");
      const quotedKey = needsQuotes ? `"${k}"` : k;
      return `${quotedKey}: "${v}"`;
    })
    .join(", ");

  // Find the first h("svg", { and inject ...props
  hCall = hCall.replace(SVG_H_CALL_REGEX, (_match, attrs) => {
    const existingAttrs = attrs.trim();
    const allAttrs = [existingAttrs, extraAttrsStr, "...props"]
      .filter(Boolean)
      .join(", ");
    return `h("svg", { ${allAttrs} }`;
  });

  // Inject title element if needed
  if (titleElement) {
    // Find the children array and prepend title
    hCall = hCall.replace(CHILDREN_ARRAY_REGEX, `], [${titleElement}`);
    // If no children array, add one with title
    if (!hCall.includes("], [")) {
      hCall = hCall.replace(
        TRAILING_CLOSE_REGEX,
        `}, [${titleElement.slice(0, -2)}])`
      );
    }
  }

  return Promise.resolve(`${componentName}: (props) => ${hCall}`);
}

export const vueStrategy: FrameworkStrategy = {
  name: "vue",

  fileExtensions: {
    typescript: ".ts",
    javascript: ".js",
  },

  optionsSchema: vueOptionsSchema,

  supportsRef: false,

  preferredOutputType: "file",

  getIconsTemplate,

  getImports(_options: VueOptions) {
    // Vue h() import is in the template
    return [];
  },

  getForwardRefImportSource() {
    return "vue";
  },

  isForwardRefEnabled(_options: VueOptions) {
    // Vue doesn't use forwardRef pattern
    return false;
  },

  promptOptions() {
    // No options to prompt for currently (syntax only has one value)
    return Promise.resolve({ syntax: "h" as const });
  },

  getConfigKey() {
    return "vue";
  },

  transformSvg,
};
