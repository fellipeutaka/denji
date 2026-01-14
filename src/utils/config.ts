import path from "node:path";
import { CONFIG_FILE, configSchema } from "~/schemas/config";
import { access, readFile } from "~/utils/fs";
import { Err, Ok } from "~/utils/result";

export async function loadConfig(cwd: string) {
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!(await access(configPath))) {
    return new Err(`${CONFIG_FILE} not found. Run "denji init" first.`);
  }

  const content = await readFile(configPath, "utf-8");
  if (content.isErr()) {
    return new Err(`Failed to read ${CONFIG_FILE}`);
  }

  try {
    const parsed = configSchema.safeParse(JSON.parse(content.value));
    if (!parsed.success) {
      return new Err(`Invalid ${CONFIG_FILE}: ${parsed.error.message}`);
    }

    return new Ok(parsed.data);
  } catch {
    return new Err(`Invalid JSON in ${CONFIG_FILE}`);
  }
}
