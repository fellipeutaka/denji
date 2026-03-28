import type { Config } from "~/schemas/config";

export interface IconEntry {
  name: string;
  source?: string;
}

export interface DisplayContext {
  cfg: Config;
  icons: IconEntry[];
  log(msg: string): void;
}

export interface DisplayStrategy {
  render(ctx: DisplayContext): void;
}

export type DisplayMode = "default" | "json" | "toon";

export async function createDisplayStrategy(
  mode: DisplayMode
): Promise<DisplayStrategy> {
  switch (mode) {
    case "json": {
      const { JsonDisplayStrategy } = await import("./json");
      return new JsonDisplayStrategy();
    }
    case "toon": {
      const { ToonDisplayStrategy } = await import("./toon");
      return new ToonDisplayStrategy();
    }
    default: {
      const { DefaultDisplayStrategy } = await import("./default");
      return new DefaultDisplayStrategy();
    }
  }
}
