"use cache";

import { lookupCollections } from "@iconify/json";
import { cacheLife } from "next/cache";
import type { CollectionItem, CollectionsByCategory } from "./types";

export async function getCollections(): Promise<CollectionItem[]> {
  cacheLife("max");

  const raw = await lookupCollections();
  const collections: CollectionItem[] = [];

  for (const [prefix, info] of Object.entries(raw)) {
    if (info.hidden) {
      continue;
    }
    collections.push({
      prefix,
      name: info.name,
      total: info.total ?? 0,
      author: info.author.name,
      license: info.license.title,
      category: info.category ?? "Uncategorized",
      samples: info.samples ?? [],
      palette: info.palette ?? false,
    });
  }

  return collections.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCollectionsByCategory(): Promise<
  CollectionsByCategory[]
> {
  cacheLife("max");

  const collections = await getCollections();
  const categoryMap = new Map<string, CollectionItem[]>();

  for (const collection of collections) {
    const list = categoryMap.get(collection.category);
    if (list) {
      list.push(collection);
    } else {
      categoryMap.set(collection.category, [collection]);
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, collections]) => ({ category, collections }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
