import type { Metadata } from "next";
import { Suspense } from "react";
import { getCollectionsByCategory } from "@/lib/iconify/collections";
import { CollectionsGrid } from "./_components/collections-grid";

export const metadata: Metadata = {
  title: "Icon Explorer",
  description:
    "Browse and search 200,000+ icons from Iconify. Find icons, add them to your bag, and get Denji CLI commands.",
};

export default async function IconsPage() {
  const collectionsByCategory = await getCollectionsByCategory();

  return (
    <div className="container mx-auto py-8">
      <h1 className="font-bold text-3xl">Icon Explorer</h1>
      <p className="mt-2 mb-8 text-fd-muted-foreground">
        Browse icon collections, search for icons, and add them to your project
        with Denji.
      </p>
      <Suspense>
        <CollectionsGrid collectionsByCategory={collectionsByCategory} />
      </Suspense>
    </div>
  );
}
