import { useState } from "react";
import { InputGroup } from "@/components/ui/input-group";
import { Link } from "@/components/ui/link";
import { SearchField } from "@/components/ui/search-field";
import type { CollectionItem } from "@/lib/iconify/types";

interface CollectionSidebarProps {
  collections: CollectionItem[];
  activePrefix: string;
}

export function CollectionSidebar({
  collections,
  activePrefix,
}: CollectionSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.prefix.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col gap-4 border-r px-2 py-4">
      <SearchField.Root
        aria-label="Search collections"
        onChange={setSearch}
        render={(props) => <InputGroup.Root {...props} />}
        value={search}
      >
        <InputGroup.Input placeholder="Search..." />
        <InputGroup.Addon align="inline-end">
          <SearchField.Button />
        </InputGroup.Addon>
      </SearchField.Root>

      <nav aria-label="Collections" className="flex-1 overflow-y-auto">
        <ul className="space-y-0.5">
          {filtered.map((collection) => (
            <li key={collection.prefix}>
              <Link
                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-fd-accent/50 ${
                  collection.prefix === activePrefix
                    ? "bg-fd-accent font-medium text-fd-accent-foreground"
                    : "text-fd-muted-foreground"
                }`}
                href={`/icons/${collection.prefix}`}
                variant="unstyled"
              >
                <span className="truncate">{collection.name}</span>
                <span className="ml-2 shrink-0 text-fd-muted-foreground text-xs">
                  {collection.total.toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
