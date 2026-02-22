import { Icon } from "@iconify/react";
import { Card } from "@/components/ui/card";
import type { CollectionItem } from "@/lib/iconify/types";

interface CollectionCardProps {
  collection: CollectionItem;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Card.Root className="transition-colors hover:bg-fd-accent/50">
      <Card.Header>
        <Card.Title className="flex items-center justify-between">
          <span>{collection.name}</span>
          <span className="font-normal text-fd-muted-foreground text-xs">
            {collection.total.toLocaleString()} icons
          </span>
        </Card.Title>
        <Card.Description>
          {collection.author} · {collection.license}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex gap-3">
          {collection.samples.slice(0, 4).map((sample) => (
            <Icon
              className="size-5 text-fd-muted-foreground"
              icon={`${collection.prefix}:${sample}`}
              key={sample}
            />
          ))}
        </div>
      </Card.Content>
    </Card.Root>
  );
}
