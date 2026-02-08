import path from "node:path";
import type { FrameworkStrategy } from "~/frameworks/types";
import type { Config } from "~/schemas/config";
import type { InitDeps } from "~/services/deps";
import { generateBarrel } from "~/utils/icons-folder";
import { Err, Ok } from "~/utils/result";

type Deps = Pick<InitDeps, "fs" | "logger">;

export async function initFolderMode(
  config: Config,
  strategy: FrameworkStrategy,
  outputPath: string,
  configPath: string,
  deps: Deps
) {
  const { fs, logger } = deps;

  if (await fs.access(outputPath)) {
    return new Err(`Output directory already exists: ${outputPath}`);
  }

  const mkdirResult = await fs.mkdir(outputPath, { recursive: true });
  if (mkdirResult.isErr()) {
    return new Err(`Failed to create directory: ${outputPath}`);
  }

  // Write denji.json
  const configContent = JSON.stringify(config, null, 2);
  const writeConfigResult = await fs.writeFile(configPath, configContent);
  if (writeConfigResult.isErr()) {
    return new Err(`Failed to write ${path.basename(configPath)}`);
  }
  logger.success(`Created ${path.basename(configPath)}`);

  // Write barrel file
  const barrelExt = config.typescript ? ".ts" : ".js";
  const barrelPath = path.join(outputPath, `index${barrelExt}`);
  const barrelContent = generateBarrel(
    [],
    strategy.fileExtensions.typescript,
    config.typescript
  );
  const writeBarrelResult = await fs.writeFile(barrelPath, barrelContent);
  if (writeBarrelResult.isErr()) {
    return new Err(`Failed to write ${config.output.path}/index${barrelExt}`);
  }
  logger.success(`Created ${config.output.path}/index${barrelExt}`);

  // Write types.ts if TypeScript
  if (config.typescript && strategy.getTypesFileContent) {
    const typesPath = path.join(outputPath, "types.ts");
    const typesContent = strategy.getTypesFileContent();
    const writeTypesResult = await fs.writeFile(typesPath, typesContent);
    if (writeTypesResult.isErr()) {
      return new Err(`Failed to write ${config.output.path}/types.ts`);
    }
    logger.success(`Created ${config.output.path}/types.ts`);
  }

  return new Ok(null);
}
