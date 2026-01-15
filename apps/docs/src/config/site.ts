export const siteConfig = {
  description:
    "CLI tool for managing SVG icons in React projects. Fetch from Iconify, convert to optimized components.",
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
    "TypeScript",
    "Open Source",
    "Accessibility",
    "Optimization",
  ] as string[],
} as const;

export type SiteConfig = typeof siteConfig;
