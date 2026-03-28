import type { DisplayContext, DisplayStrategy } from "./index";

export class DefaultDisplayStrategy implements DisplayStrategy {
  render({ cfg, icons, log }: DisplayContext): void {
    const trackSource = cfg.trackSource ?? true;

    for (const icon of icons) {
      if (trackSource) {
        const sourceInfo = icon.source ? `(${icon.source})` : "(⚠️  Unknown)";
        log(`  • ${icon.name} ${sourceInfo}`);
      } else {
        log(`  • ${icon.name}`);
      }
    }
  }
}
