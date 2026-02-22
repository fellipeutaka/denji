export type { IconifyInfo, IconifyJSON } from "@iconify/types";

export interface CollectionItem {
  prefix: string;
  name: string;
  total: number;
  author: string;
  license: string;
  category: string;
  samples: string[];
  palette: boolean;
}

export interface CollectionsByCategory {
  category: string;
  collections: CollectionItem[];
}

export interface CollectionIcons {
  prefix: string;
  name: string;
  total: number;
  icons: string[];
  categories?: Record<string, string[]>;
}
