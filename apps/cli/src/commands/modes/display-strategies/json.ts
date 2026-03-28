import type { DisplayContext, DisplayStrategy } from "./index";

export class JsonDisplayStrategy implements DisplayStrategy {
  render({ cfg, icons, log }: DisplayContext): void {
    const trackSource = cfg.trackSource ?? true;

    const output = {
      count: icons.length,
      output: cfg.output.path,
      icons: trackSource
        ? icons.map((icon) => ({
            name: icon.name,
            source: icon.source ?? null,
          }))
        : icons.map((icon) => icon.name),
    };
    log(JSON.stringify(output, null, 2));
  }
}
