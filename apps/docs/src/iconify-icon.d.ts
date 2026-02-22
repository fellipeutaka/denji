declare module "react" {
  // biome-ignore lint/style/noNamespace: Required for JSX.IntrinsicElements augmentation
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          icon: string;
          width?: string | number;
          height?: string | number;
          mode?: "svg" | "bg" | "mask" | "style";
          inline?: boolean;
          flip?: string;
          rotate?: string | number;
        },
        HTMLElement
      >;
    }
  }
}

export {};
