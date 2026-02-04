import { Eta } from "eta";

/**
 * Create an Eta instance configured for a specific framework's templates directory.
 *
 * @param templatesDir - Absolute path to the templates directory
 */
export function createEta(templatesDir: string): Eta {
  return new Eta({
    views: templatesDir,
    autoEscape: false,
    autoTrim: false,
  });
}
