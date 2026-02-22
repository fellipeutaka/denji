"use cache";

import { lookupCollection } from "@iconify/json";
import { getIconData, iconToHTML, iconToSVG } from "@iconify/utils";
import { cacheLife } from "next/cache";
import type { CollectionIcons } from "./types";

export async function getCollectionIcons(
  prefix: string
): Promise<CollectionIcons> {
  cacheLife("max");

  const data = await lookupCollection(prefix);
  const icons = Object.keys(data.icons);

  return {
    prefix: data.prefix ?? prefix,
    name: data.info?.name ?? prefix,
    total: icons.length,
    icons,
    categories: data.categories,
  };
}

export async function getIconSvg(
  prefix: string,
  name: string
): Promise<string | null> {
  cacheLife("max");

  const data = await lookupCollection(prefix);
  const iconData = getIconData(data, name);
  if (!iconData) {
    return null;
  }

  const renderData = iconToSVG(iconData);
  return iconToHTML(renderData.body, renderData.attributes);
}
