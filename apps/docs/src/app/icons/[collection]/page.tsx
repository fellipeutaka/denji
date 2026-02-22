import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCollections } from "@/lib/iconify/collections";
import { getCollectionIcons } from "@/lib/iconify/icons";
import { CollectionView } from "../_components/collection-view";

export async function generateMetadata({
  params,
}: PageProps<"/icons/[collection]">): Promise<Metadata> {
  const { collection: prefix } = await params;
  const icons = await getCollectionIcons(prefix).catch(() => null);

  if (!icons) {
    return { title: "Collection Not Found" };
  }

  return {
    title: `${icons.name} Icons`,
    description: `Browse ${icons.total} icons from the ${icons.name} collection.`,
  };
}

async function CollectionContent({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: prefix } = await params;

  const [collections, icons] = await Promise.all([
    getCollections(),
    getCollectionIcons(prefix).catch(() => null),
  ]);

  if (!icons) {
    notFound();
  }

  return <CollectionView collections={collections} icons={icons} />;
}

export default function CollectionPage({
  params,
}: PageProps<"/icons/[collection]">) {
  return (
    <Suspense>
      <CollectionContent params={params} />
    </Suspense>
  );
}
