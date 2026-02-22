import { Err, Ok } from "~/utils/result";

const ICON_NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateIconName(icon: string) {
  const parts = icon.split(":");

  if (parts.length !== 2) {
    return new Err(
      `Invalid icon format "${icon}". Expected "prefix:name" (e.g., mdi:home)`
    );
  }

  const [prefix, name] = parts as [string, string];

  if (!ICON_NAME_REGEX.test(prefix)) {
    return new Err(
      `Invalid prefix "${prefix}". Must match: lowercase letters, numbers, hyphens`
    );
  }

  if (!ICON_NAME_REGEX.test(name)) {
    return new Err(
      `Invalid name "${name}". Must match: lowercase letters, numbers, hyphens`
    );
  }

  return new Ok({ prefix, name });
}

const SPLIT_REGEX = /[-_]/;
const LEADING_DIGIT_REGEX = /^\d/;

export function toComponentName(icon: string) {
  const name = icon.split(":")[1];
  if (!name) {
    throw new Error(`Invalid icon format: ${icon}`);
  }

  const segments = name
    .split(SPLIT_REGEX)
    .filter(Boolean)
    .map((s) => s.at(0)?.toUpperCase() + s.slice(1).toLowerCase());

  // Move leading numeric segments to end (JS identifiers can't start with numbers)
  let first = segments[0];
  while (first && LEADING_DIGIT_REGEX.test(first)) {
    segments.push(segments.shift() ?? "");
    first = segments[0];
  }

  return segments.join("");
}
