import path from "node:path";

const RESERVED_FILES = new Set(["index.ts", "index.js", "types.ts"]);

/**
 * Get existing icon names from a folder by scanning for component files.
 * Filters out barrel (index.*) and types files.
 */
export function getExistingIconNames(files: string[], ext: string): string[] {
  return files
    .filter((f) => f.endsWith(ext) && !RESERVED_FILES.has(f))
    .map((f) => path.basename(f, ext))
    .sort();
}

/**
 * Generate barrel file content that exports an Icons object.
 *
 * Example output (TS):
 * ```
 * import Check from "./Check.svelte";
 * import Home from "./Home.svelte";
 *
 * export const Icons = { Check, Home } as const satisfies Record<string, typeof Check>;
 * export type IconName = keyof typeof Icons;
 * ```
 */
export function generateBarrel(
  names: string[],
  ext: string,
  typescript: boolean
): string {
  const sorted = [...names].sort();

  if (sorted.length === 0) {
    if (typescript) {
      return "export const Icons = {} as const;\n\nexport type IconName = keyof typeof Icons;\n";
    }
    return "export const Icons = {};\n";
  }

  const imports = sorted
    .map((name) => `import ${name} from "./${name}${ext}";`)
    .join("\n");

  const iconEntries = sorted.join(", ");

  if (typescript) {
    return `${imports}\n\nexport const Icons = { ${iconEntries} } as const satisfies Record<string, typeof ${sorted[0]}>;

export type IconName = keyof typeof Icons;\n`;
  }

  return `${imports}\n\nexport const Icons = { ${iconEntries} };\n`;
}

/**
 * Generate types.ts content for folder mode.
 *
 * Exports IconProps type based on framework's SVG prop type.
 */
export function generateTypes(
  iconPropsType: string,
  iconPropsImport: string
): string {
  return `${iconPropsImport}\n\nexport type IconProps = ${iconPropsType};\n`;
}
