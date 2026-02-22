import { Err, Ok } from "~/utils/result";

export async function fetchIcon(iconName: string) {
  try {
    const { loadIcon, buildIcon } = await import("iconify-icon");

    const data = await loadIcon(iconName);
    if (!data) {
      return new Err(`Icon "${iconName}" not found`);
    }

    const built = buildIcon(data, { height: "1em" });
    if (!built) {
      return new Err(`Failed to build icon "${iconName}"`);
    }

    const attrs = Object.entries(built.attributes)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");

    return new Ok(
      `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${built.body}</svg>`
    );
  } catch {
    return new Err(`Icon "${iconName}" not found`);
  }
}
