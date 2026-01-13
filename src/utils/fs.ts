import fs from "node:fs/promises";
import { Err, Ok } from "./result";

export async function writeFile(
  file: Parameters<typeof fs.writeFile>[0],
  data: Parameters<typeof fs.writeFile>[1],
  options?: Parameters<typeof fs.writeFile>[2]
) {
  try {
    await fs.writeFile(file, data, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to write file.");
  }
}

export async function readFile<File extends string | Buffer>(
  path: Parameters<typeof fs.readFile>[0],
  options?: Parameters<typeof fs.readFile>[1]
) {
  try {
    const file = await fs.readFile(path, options);

    return new Ok(file as File);
  } catch {
    return new Err("Failed to read file.");
  }
}

export async function rm(
  file: Parameters<typeof fs.rm>[0],
  options?: Parameters<typeof fs.rm>[1]
) {
  try {
    await fs.rm(file, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to remove file.");
  }
}

export async function mkdir(
  path: Parameters<typeof fs.mkdir>[0],
  options?: Parameters<typeof fs.mkdir>[1]
) {
  try {
    await fs.mkdir(path, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to create directory.");
  }
}

export async function access(
  path: Parameters<typeof fs.access>[0],
  mode?: Parameters<typeof fs.access>[1]
) {
  try {
    await fs.access(path, mode);

    return true;
  } catch {
    return false;
  }
}

export async function appendFile(
  path: Parameters<typeof fs.appendFile>[0],
  data: Parameters<typeof fs.appendFile>[1],
  options?: Parameters<typeof fs.appendFile>[2]
) {
  try {
    await fs.appendFile(path, data, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to append file.");
  }
}
