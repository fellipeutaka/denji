import "iconify-icon";
import { useHotkey } from "@tanstack/react-hotkeys";
import { debounce, useQueryState } from "nuqs";
import { useDeferredValue, useRef } from "react";
import {
  GridLayout,
  GridList,
  GridListItem,
  type Selection,
  Size,
  Virtualizer,
} from "react-aria-components";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input-group";
import { SearchField } from "@/components/ui/search-field";
import { Tooltip } from "@/components/ui/tooltip";
import type { CollectionIcons } from "@/lib/iconify/types";

const ICON_CELL_SIZE = new Size(40, 40);
const ICON_MIN_SPACE = new Size(4, 4);

interface IconGridProps {
  icons: CollectionIcons;
  selectedKeys: Selection;
  onSelectionChange: (keys: Selection) => void;
  onAction: (key: string) => void;
}

function countFilteredIcons(search: string, icons: string[]): number {
  const query = search.toLowerCase();
  if (!query) {
    return icons.length;
  }

  return icons.reduce((count, name) => {
    return count + (name.toLowerCase().includes(query) ? 1 : 0);
  }, 0);
}

function getFilteredIcons(
  search: string,
  icons: IconGridProps["icons"]
): { id: string; name: string }[] {
  const query = search.toLowerCase();
  if (!query) {
    return icons.icons.map((name) => ({ id: `${icons.prefix}:${name}`, name }));
  }
  return icons.icons
    .filter((name) => name.toLowerCase().includes(query))
    .map((name) => ({ id: `${icons.prefix}:${name}`, name }));
}

export function IconGrid({
  icons,
  selectedKeys,
  onSelectionChange,
  onAction,
}: IconGridProps) {
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    limitUrlUpdates: debounce(300),
  });
  const deferredSearch = useDeferredValue(search);
  const filteredCount = countFilteredIcons(deferredSearch, icons.icons);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useHotkey(
    "/",
    () => {
      searchInputRef.current?.focus();
    }
    // { enabled: !!searchInputRef.current }
  );

  function handleSearchChange(value: string) {
    setSearch(value || null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-4">
        <SearchField.Root
          aria-label="Search icons"
          className="flex-1"
          defaultValue={search}
          onChange={handleSearchChange}
          render={(props) => <InputGroup.Root {...props} />}
        >
          <InputGroup.Addon align="inline-start">
            <Icons.Search />
          </InputGroup.Addon>
          <InputGroup.Input
            placeholder={`Search ${icons.total.toLocaleString()} icons...`}
            ref={searchInputRef}
          />
          <InputGroup.Addon align="inline-end">
            <kbd className="pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-sm bg-muted in-data-[slot=tooltip-content]:bg-background/20 px-1 font-medium font-sans in-data-[slot=tooltip-content]:text-background text-muted-foreground text-xs dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3">
              /
            </kbd>
          </InputGroup.Addon>
        </SearchField.Root>
        <span className="shrink-0 text-fd-muted-foreground text-sm">
          {filteredCount.toLocaleString()} icons
        </span>
      </div>

      <IconGridList
        icons={icons}
        onAction={onAction}
        onSelectionChange={onSelectionChange}
        search={deferredSearch}
        selectedKeys={selectedKeys}
      />
    </div>
  );
}

interface IconGridListProps {
  icons: IconGridProps["icons"];
  selectedKeys: IconGridProps["selectedKeys"];
  onSelectionChange: IconGridProps["onSelectionChange"];
  onAction: IconGridProps["onAction"];
  search: string;
}

function IconGridList({
  icons,
  selectedKeys,
  onSelectionChange,
  onAction,
  search,
}: IconGridListProps) {
  const filteredIcons = getFilteredIcons(search, icons);

  if (filteredIcons.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-fd-muted-foreground">
        No icons found for &ldquo;{search}&rdquo;
      </div>
    );
  }

  return (
    <Virtualizer
      layout={GridLayout}
      layoutOptions={{
        minItemSize: ICON_CELL_SIZE,
        maxItemSize: ICON_CELL_SIZE,
        minSpace: ICON_MIN_SPACE,
      }}
    >
      <GridList
        aria-label={`${icons.name} icons`}
        className="block size-full overflow-auto p-0 outline-none"
        items={filteredIcons}
        layout="grid"
        onAction={(key) => onAction(String(key))}
        onSelectionChange={onSelectionChange}
        selectedKeys={selectedKeys}
        selectionBehavior="toggle"
        selectionMode="multiple"
      >
        {(item) => (
          <GridListItem id={item.id} textValue={item.name}>
            <Tooltip.Root>
              <Button className="size-10" variant="ghost">
                <iconify-icon
                  height="24"
                  icon={item.id}
                  title={item.name}
                  width="24"
                />
              </Button>
              <Tooltip.Content>
                {item.name}
                <Tooltip.Arrow />
              </Tooltip.Content>
            </Tooltip.Root>
          </GridListItem>
        )}
      </GridList>
    </Virtualizer>
  );
}
