import path from "node:path";
import { z } from "zod";
import { CONFIG_SCHEMA_FILE, configSchema } from "~/schemas/config";
import { writeFile } from "~/utils/fs";

const jsonSchema = z.toJSONSchema(configSchema);
const schemaPath = path.join(import.meta.dirname, "..", CONFIG_SCHEMA_FILE);
const result = await writeFile(schemaPath, JSON.stringify(jsonSchema, null, 2));

if (result.isErr()) {
  console.error(`❌ ${result.error}`);
  process.exit(1);
}

console.log(`✅ Generated ${CONFIG_SCHEMA_FILE} successfully.`);
