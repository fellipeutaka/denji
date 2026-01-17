import { type Config, frameworkSchema } from "~/schemas/config";

export function getIconsTemplate({ framework, typescript }: Config): string {
  const { error } = frameworkSchema.safeParse(framework);
  if (error) {
    return "";
  }

  if (typescript) {
    return [
      'import React from "react";',
      "",
      "export type Icon = (props: IconProps) => React.JSX.Element;",
      'export type IconProps = React.ComponentProps<"svg">;',
      "export type IconName = keyof typeof Icons;",
      "",
      "export const Icons = {} as const satisfies Record<string, Icon>;",
      "export function DynamicIcon({",
      "  name,",
      "  ...props",
      "}: IconProps & { name: IconName }) {",
      "  const Icon = (Icons[name] ?? React.Fragment) as Icon;",
      "  return <Icon {...props} />;",
      "}",
      "",
    ].join("\n");
  }

  return [
    'import React from "react";',
    "",
    "/**",
    " * @typedef {(props: IconProps) => React.JSX.Element} Icon",
    ' * @typedef {React.ComponentProps<"svg">} IconProps',
    " * @typedef {keyof typeof Icons} IconName",
    " */",
    "",
    "/** @satisfies {Record<string, Icon>} */",
    "export const Icons = {};",
    "/** @param {IconProps & { name: IconName }} */",
    "export function DynamicIcon({ name, ...props }) {",
    "  const Icon = Icons[name] ?? React.Fragment;",
    "  return <Icon {...props} />;",
    "}",
  ].join("\n");
}
