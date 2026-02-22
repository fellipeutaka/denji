import type { FrameworkStrategy } from "~/frameworks/types";
import type { Config } from "~/schemas/config";
import type {
  ConfigLoader,
  FileSystem,
  FrameworkFactory,
} from "~/services/deps";
import { Err, Ok, type ResultType } from "~/utils/result";

interface ResolveContextDeps {
  config: ConfigLoader;
  frameworks: FrameworkFactory;
  fs: Pick<FileSystem, "access">;
}

interface CommandContext {
  cfg: Config;
  strategy: FrameworkStrategy;
}

export async function resolveContext(
  deps: ResolveContextDeps,
  cwd: string
): Promise<ResultType<CommandContext, string>> {
  if (!(await deps.fs.access(cwd))) {
    return new Err(`Directory does not exist: ${cwd}`);
  }

  const configResult = await deps.config.loadConfig(cwd);
  if (configResult.isErr()) {
    return configResult;
  }
  const cfg = configResult.value;

  const strategy = await deps.frameworks.createStrategy(cfg.framework);

  return new Ok({ cfg, strategy });
}
