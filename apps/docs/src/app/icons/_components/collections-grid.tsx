"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { debounce, useQueryState } from "nuqs";
import { Icons } from "@/components/icons";
import { InputGroup } from "@/components/ui/input-group";
import { Link } from "@/components/ui/link";
import { SearchField } from "@/components/ui/search-field";
import type { CollectionsByCategory } from "@/lib/iconify/types";
import { CollectionCard } from "./collection-card";

interface CollectionsGridProps {
  collectionsByCategory: CollectionsByCategory[];
}

export function CollectionsGrid({
  collectionsByCategory,
}: CollectionsGridProps) {
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    limitUrlUpdates: debounce(300),
  });
  const [deferredSearch] = useDebouncedValue(search, { wait: 300 });

  const filtered = collectionsByCategory
    .map(({ category, collections }) => ({
      category,
      collections: collections.filter(
        (c) =>
          c.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          c.prefix.toLowerCase().includes(deferredSearch.toLowerCase())
      ),
    }))
    .filter(({ collections }) => collections.length > 0);

  function handleSearchChange(value: string) {
    setSearch(value || null);
  }

  return (
    <div className="space-y-8">
      <SearchField.Root
        aria-label="Search collections"
        defaultValue={search}
        onChange={handleSearchChange}
        render={(props) => <InputGroup.Root {...props} />}
      >
        <InputGroup.Addon align="inline-start">
          <Icons.Search />
        </InputGroup.Addon>
        <InputGroup.Input placeholder="Search collections..." />
        <SearchField.Button />
      </SearchField.Root>

      {filtered.map(({ category, collections }) => (
        <section key={category}>
          <h2 className="mb-4 font-semibold text-fd-muted-foreground text-sm uppercase tracking-wider">
            {category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                href={`/icons/${collection.prefix}`}
                key={collection.prefix}
                variant="unstyled"
              >
                <CollectionCard collection={collection} />
              </Link>
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="py-12 text-center text-fd-muted-foreground">
          No collections found for &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
