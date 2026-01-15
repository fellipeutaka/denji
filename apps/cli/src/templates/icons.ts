import type { Config } from "~/schemas/config";

export function getIconsTemplate(config: Config): string {
  if (config.framework === "react") {
    if (config.typescript) {
      return `export type IconProps = React.ComponentProps<"svg">;
export type Icon = (props: IconProps) => React.JSX.Element;

export const Icons = {} as const satisfies Record<string, Icon>;
`;
    }

    return `export const Icons = {};
`;
  }

  return "";
}
