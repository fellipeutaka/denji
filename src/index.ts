#!/usr/bin/env node

import { Command } from "commander";
import { description, name, version } from "../package.json";
import { add } from "./commands/add";
import { init } from "./commands/init";
import { list } from "./commands/list";

const exitProcess = () => process.exit(0);
process.on("SIGINT", exitProcess);
process.on("SIGTERM", exitProcess);

const program = new Command()
  .name(name)
  .description(description)
  .version(version, "-v, --version", "Display the version number.");

program.addCommand(add);
program.addCommand(init);
program.addCommand(list);

program.parse();
