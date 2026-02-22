import { cacheLife } from "next/cache";
import { getLLMText, source } from "@/lib/source";

export async function GET() {
  const scanned = await getScanned();

  return new Response(scanned.join("\n\n"));
}

async function getScanned() {
  "use cache";
  cacheLife("max");

  const scan = source.getPages().map(getLLMText);
  return await Promise.all(scan);
}
