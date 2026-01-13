import { logger } from "./logger";

export function handleError(error: string): never {
  logger.error(
    "Something went wrong. Please check the error below for more details."
  );
  logger.error("If the problem persists, please open an issue on GitHub.");
  logger.break();

  logger.error(error);
  logger.break();
  process.exit(1);
}
