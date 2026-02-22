"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";
import type { Selection } from "react-aria-components";
import type { CollectionIcons, CollectionItem } from "@/lib/iconify/types";
import { Bag } from "./bag";
import { CollectionSidebar } from "./collection-sidebar";
import { IconDetailPanel } from "./icon-detail-panel";
import { IconGrid } from "./icon-grid";

interface CollectionViewProps {
  collections: CollectionItem[];
  icons: CollectionIcons;
}

export function CollectionView({ collections, icons }: CollectionViewProps) {
  const [bagParam, setBagParam] = useQueryState("bag", { defaultValue: "" });
  const [detailIconId, setDetailIconId] = useState<string | null>(null);

  const bagItems = bagParam ? bagParam.split(",").filter(Boolean) : [];
  const bagSet = new Set(bagItems);

  const updateBag = (newItems: string[]) => {
    setBagParam(newItems.length > 0 ? newItems.join(",") : null);
  };

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") {
      const allIds = icons.icons.map((name) => `${icons.prefix}:${name}`);
      updateBag(allIds);
      return;
    }
    updateBag([...keys].map(String));
  };

  const handleToggleBag = (iconId: string) => {
    if (bagSet.has(iconId)) {
      updateBag(bagItems.filter((id) => id !== iconId));
    } else {
      updateBag([...bagItems, iconId]);
    }
  };

  const handleRemoveFromBag = (id: string) => {
    updateBag(bagItems.filter((item) => item !== id));
  };

  const handleClearBag = () => {
    setBagParam(null);
  };

  return (
    <div className="flex h-screen">
      <div className="hidden md:block">
        <CollectionSidebar
          activePrefix={icons.prefix}
          collections={collections}
        />
      </div>

      <main
        className="flex flex-1 flex-col gap-2 overflow-hidden p-4 data-[has-bag=true]:pb-16"
        data-has-bag={bagItems.length > 0 ? "true" : "false"}
      >
        <h1 className="scroll-m-20 font-semibold text-xl tracking-tight">
          {icons.name}
        </h1>
        <IconGrid
          icons={icons}
          onAction={(key) => setDetailIconId(key)}
          onSelectionChange={handleSelectionChange}
          selectedKeys={bagSet}
        />
      </main>

      {detailIconId && (
        <IconDetailPanel
          iconId={detailIconId}
          isInBag={bagSet.has(detailIconId)}
          isOpen={detailIconId !== null}
          key={detailIconId}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setDetailIconId(null);
            }
          }}
          onToggleBag={() => handleToggleBag(detailIconId)}
        />
      )}

      <Bag
        items={bagItems}
        onClear={handleClearBag}
        onRemove={handleRemoveFromBag}
      />
    </div>
  );
}
