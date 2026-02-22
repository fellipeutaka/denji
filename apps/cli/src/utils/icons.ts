import { parseSync } from "oxc-parser";

// Re-export split modules for backward compatibility
export { fetchIcon } from "~/utils/fetch-icon";
export { toComponentName, validateIconName } from "~/utils/validate-icon";

// ============================================================================
// Icons File Parsing (AST-based)
// ============================================================================

const DATA_ICON_REGEX = /data-icon="([^"]+)"/;

interface IconEntry {
  end: number;
  name: string;
  source?: string;
  start: number;
}

export function parseIconsFile(content: string): {
  icons: IconEntry[];
  objectStart: number;
  objectEnd: number;
} {
  const result = parseSync("icons.tsx", content);
  const ast = result.program;
  const icons: IconEntry[] = [];
  let objectStart = 0;
  let objectEnd = 0;

  // Find the Icons export declaration
  for (const node of ast.body) {
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration"
    ) {
      for (const decl of node.declaration.declarations) {
        if (decl.id?.type === "Identifier" && decl.id.name === "Icons") {
          // Navigate through TSSatisfiesExpression -> TSAsExpression -> ObjectExpression
          let obj = decl.init;

          // Unwrap TSSatisfiesExpression
          if (obj?.type === "TSSatisfiesExpression") {
            obj = obj.expression;
          }

          // Unwrap TSAsExpression
          if (obj?.type === "TSAsExpression") {
            obj = obj.expression;
          }

          if (obj?.type === "ObjectExpression") {
            objectStart = obj.start + 1; // After opening brace
            objectEnd = obj.end - 1; // Before closing brace

            for (const prop of obj.properties) {
              if (
                prop.type !== "SpreadElement" &&
                prop.key?.type === "Identifier"
              ) {
                // Extract data-icon attribute if present
                const iconCode = content.slice(prop.start, prop.end);
                const dataIconMatch = iconCode.match(DATA_ICON_REGEX);
                const source = dataIconMatch?.[1];

                icons.push({
                  name: prop.key.name,
                  start: prop.start,
                  end: prop.end,
                  source,
                });
              }
            }
          }
        }
      }
    }
  }

  return { icons, objectStart, objectEnd };
}

export function getExistingIconNames(content: string): string[] {
  const { icons } = parseIconsFile(content);
  return icons.map((i) => i.name);
}

export function insertIconAlphabetically(
  content: string,
  name: string,
  component: string
): string {
  const { icons, objectStart, objectEnd } = parseIconsFile(content);

  // Find insertion point (alphabetical order)
  const insertIndex = icons.findIndex((i) => i.name.localeCompare(name) > 0);

  if (icons.length === 0) {
    // Empty object - insert after opening brace
    return `${content.slice(0, objectStart)}\n  ${component},\n${content.slice(objectEnd)}`;
  }

  if (insertIndex === -1) {
    // Insert at end (after last icon)
    const lastIcon = icons.at(-1);
    if (!lastIcon) {
      throw new Error("Failed to find last icon");
    }
    return `${content.slice(0, lastIcon.end)},\n  ${component}${content.slice(lastIcon.end)}`;
  }

  if (insertIndex === 0) {
    // Insert at beginning
    const firstIcon = icons[0];
    if (!firstIcon) {
      throw new Error("Failed to find first icon");
    }
    return `${content.slice(0, firstIcon.start)}${component},\n  ${content.slice(firstIcon.start)}`;
  }

  // Insert before the found icon
  const targetIcon = icons[insertIndex];
  if (!targetIcon) {
    throw new Error("Failed to find target icon");
  }
  const insertPos = targetIcon.start;
  return `${content.slice(0, insertPos)}${component},\n  ${content.slice(insertPos)}`;
}

export function replaceIcon(
  content: string,
  name: string,
  component: string
): string {
  const { icons } = parseIconsFile(content);
  const existing = icons.find((i) => i.name === name);

  if (!existing) {
    return content;
  }

  return `${content.slice(0, existing.start)}${component}${content.slice(existing.end)}`;
}

export function removeIcon(content: string, name: string): string {
  const { icons } = parseIconsFile(content);
  const index = icons.findIndex((i) => i.name === name);

  if (index === -1) {
    return content;
  }

  const icon = icons[index];
  if (!icon) {
    return content;
  }

  const isLast = index === icons.length - 1;
  const isOnly = icons.length === 1;

  if (isOnly) {
    // Remove icon and leave empty object
    return `${content.slice(0, icon.start).trimEnd()}${content.slice(icon.end).trimStart()}`;
  }

  if (isLast) {
    // Remove trailing comma from previous icon and this icon
    const prevIcon = icons[index - 1];
    if (!prevIcon) {
      return content;
    }
    // Find comma after previous icon
    const betweenContent = content.slice(prevIcon.end, icon.start);
    const commaIndex = betweenContent.indexOf(",");
    if (commaIndex !== -1) {
      return `${content.slice(0, prevIcon.end)}${content.slice(icon.end)}`;
    }
    return `${content.slice(0, prevIcon.end)}\n${content.slice(icon.end).trimStart()}`;
  }

  // First or middle icon - remove icon and trailing comma/whitespace up to next icon
  const nextIcon = icons[index + 1];
  if (!nextIcon) {
    return content;
  }
  return `${content.slice(0, icon.start)}${content.slice(nextIcon.start)}`;
}
