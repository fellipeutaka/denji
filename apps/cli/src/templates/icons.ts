import type { Config } from "~/schemas/config";

function getIconType(forwardRef: boolean): string {
  if (forwardRef) {
    return 'export type Icon = React.ForwardRefExoticComponent<IconProps & React.ComponentRef<"svg">>;';
  }
  return "export type Icon = (props: IconProps) => React.JSX.Element;";
}

export function getIconsTemplate(config: Config): string {
  if (config.framework === "react") {
    if (config.typescript) {
      const iconType = getIconType(config.react?.forwardRef ?? false);
      return `export type IconProps = React.ComponentProps<"svg">;
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
