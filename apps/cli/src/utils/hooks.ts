import { spawn } from "node:child_process";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";

export async function runHooks(hooks: string[], cwd: string) {
  if (hooks.length === 0) {
    return new Ok(null);
  }

  for (const hook of hooks) {
    logger.info(`Running: ${hook}`);

    const result = await runCommand(hook, cwd);
    if (result.isErr()) {
      return result;
    }
  }

  return new Ok(null);
}

function runCommand(
  command: string,
  cwd: string
): Promise<Ok<null, string> | Err<null, string>> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: "inherit",
    });

    child.on("error", (err) => {
      resolve(new Err(`Hook failed: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(new Ok(null));
      } else {
        resolve(new Err(`Hook "${command}" exited with code ${code}`));
      }
    });
  });
}
