import { encode } from "@toon-format/toon";
import type { DisplayContext, DisplayStrategy } from "./index";

export class ToonDisplayStrategy implements DisplayStrategy {
  render({ cfg, icons, log }: DisplayContext): void {
    const trackSource = cfg.trackSource ?? true;

    const data = {
      count: icons.length,
      output: cfg.output.path,
      icons: trackSource
        ? icons.map((icon) => ({
            name: icon.name,
            source: icon.source ?? null,
          }))
        : icons.map((icon) => icon.name),
    };
    log(encode(data));
  }
}
