import { Command } from "commander";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { Err, Ok } from "~/utils/result";

export interface InitOptions {
  cwd: string;
}

export const add = new Command()
  .name("add")
  .description("Add a new icon")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: InitOptions) => {
    const optionsResult = await parseOptions(options);

    if (optionsResult.isErr()) {
      handleError(optionsResult.error);
    }

    // Logic to add a new icon goes here
  });

async function parseOptions(options: InitOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok(options);
}
