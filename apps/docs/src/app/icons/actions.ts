"use server";

import { getIconSvg } from "@/lib/iconify/icons";

export async function fetchIconSvg(
  prefix: string,
  name: string
): Promise<string | null> {
  return await getIconSvg(prefix, name);
}
