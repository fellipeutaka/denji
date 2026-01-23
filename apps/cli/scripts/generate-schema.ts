/** biome-ignore-all lint/performance/noDelete: For this script it's fine */
import path from "node:path";
import { z } from "zod";
import { CONFIG_SCHEMA_FILE, configSchema } from "~/schemas/config";
import { writeFile } from "~/utils/fs";

const jsonSchema = z.toJSONSchema(configSchema, {
  override: ({ jsonSchema }) => {
    // Fix intersection schemas: use unevaluatedProperties instead of additionalProperties
    if (!jsonSchema.allOf) {
      return;
    }

    for (const sub of jsonSchema.allOf) {
      delete sub.additionalProperties;
      for (const oneOf of sub.oneOf ?? []) {
        delete oneOf.additionalProperties;
      }
    }
    jsonSchema.unevaluatedProperties = false;
  },
});
const schemaContent = JSON.stringify(jsonSchema, null, 2);

// Write to CLI directory
const cliSchemaPath = path.join(import.meta.dirname, "..", CONFIG_SCHEMA_FILE);
const cliResult = await writeFile(cliSchemaPath, schemaContent);

if (cliResult.isErr()) {
  console.error(`❌ Failed to write to CLI: ${cliResult.error}`);
  process.exit(1);
}

// Write to docs public directory
const docsSchemaPath = path.join(
  import.meta.dirname,
  "..",
  "..",
  "docs",
  "public",
  CONFIG_SCHEMA_FILE
);
const docsResult = await writeFile(docsSchemaPath, schemaContent);

if (docsResult.isErr()) {
  console.error(`❌ Failed to write to docs: ${docsResult.error}`);
  process.exit(1);
}

console.log(`✅ Generated ${CONFIG_SCHEMA_FILE} successfully in CLI and docs.`);
