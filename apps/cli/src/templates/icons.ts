import type { Config } from "~/schemas/config";

function getReactIconType(forwardRef: boolean): string {
  if (forwardRef) {
    return 'export type Icon = React.ForwardRefExoticComponent<IconProps & React.ComponentRef<"svg">>;';
  }
  return "export type Icon = (props: IconProps) => React.JSX.Element;";
}

function getPreactIconType(forwardRef: boolean): string {
  if (forwardRef) {
    return "export type Icon = preact.ForwardRefExoticComponent<IconProps & preact.RefAttributes<SVGSVGElement>>;";
  }
  return "export type Icon = (props: IconProps) => preact.JSX.Element;";
}

export function getIconsTemplate(config: Config): string {
  if (config.framework === "react") {
    if (config.typescript) {
      const iconType = getReactIconType(config.react?.forwardRef ?? false);
      return `export type IconProps = React.ComponentProps<"svg">;
${iconType}

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
`;
    }

    return `export const Icons = {};
`;
  }

  if (config.framework === "preact") {
    if (config.typescript) {
      const iconType = getPreactIconType(config.preact?.forwardRef ?? false);
      return `import type * as preact from "preact/compat";

export type IconProps = preact.ComponentProps<"svg">;
${iconType}

export const Icons = {} as const satisfies Record<string, Icon>;

export type IconName = keyof typeof Icons;
`;
    }

    return `export const Icons = {};
`;
  }

  return "";
}
