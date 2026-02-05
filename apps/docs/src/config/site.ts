export const siteConfig = {
  description:
    "CLI tool for managing SVG icons in frontend projects. Supports React, Preact, and Solid.",
  links: {
    github: "https://github.com/fellipeutaka/denji",
    twitter: "https://twitter.com/fellipeutaka",
  },
  name: "Denji",
  url: "https://denji-docs.vercel.app",
  keywords: [
    "CLI",
    "SVG",
    "Iconify",
    "React",
    "Preact",
    "Solid",
    "TypeScript",
    "Open Source",
    "Accessibility",
    "Optimization",
  ] as string[],
} as const;

export type SiteConfig = typeof siteConfig;
