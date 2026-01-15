import picocolors from "picocolors";

const c = console;

export const logger = {
  error(input: string) {
    c.error(picocolors.red(input));
  },
  warn(input: string) {
    c.warn(picocolors.yellow(input));
  },
  info(input: string) {
    c.info(picocolors.cyan(input));
  },
  success(input: string) {
    c.info(picocolors.green(input));
  },
  break() {
    c.info("");
  },
};
