import { Icon } from "@iconify/react";
import { ShoppingBagIcon, TrashIcon, XIcon } from "lucide-react";
import { useState } from "react";
import {
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from "react-aria-components";
import { Button } from "@/components/ui/button";
import { SelectTrigger } from "@/components/ui/select";
import { CopyButton } from "./copy-button";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";
type InstallMode = "local" | "remote";

const PM_EXEC: Record<PackageManager, Record<InstallMode, string>> = {
  bun: { local: "bun denji", remote: "bunx --bun denji" },
  npm: { local: "npm run denji", remote: "npx denji" },
  yarn: { local: "yarn denji", remote: "yarn dlx denji" },
  pnpm: { local: "pnpm denji", remote: "pnpm dlx denji" },
};

interface BagProps {
  items: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const getCommand = (
  items: BagProps["items"],
  pm: PackageManager,
  mode: InstallMode
) => {
  if (items.length === 0) {
    return "";
  }
  return `${PM_EXEC[pm][mode]} add ${items.join(" ")}`;
};

export function Bag({ items, onRemove, onClear }: BagProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pm, setPm] = useState<PackageManager>("bun");
  const [mode, setMode] = useState<InstallMode>("remote");

  const command = getCommand(items, pm, mode);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {isOpen && (
        <div className="border-t bg-fd-background shadow-lg">
          <div className="container flex max-h-80 flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Bag ({items.length} icon{items.length !== 1 ? "s" : ""})
              </h3>
              <div className="flex gap-2">
                <Button onPress={onClear} size="sm" variant="ghost">
                  <TrashIcon className="mr-1 size-4" />
                  Clear
                </Button>
                <Button
                  aria-label="Close bag"
                  onPress={() => setIsOpen(false)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 overflow-y-auto">
              {items.map((id) => (
                <div
                  className="flex items-center gap-1.5 rounded-md border bg-fd-card px-2 py-1"
                  key={id}
                >
                  <Icon className="size-4" icon={id} />
                  <span className="text-xs">{id}</span>
                  <Button
                    aria-label={`Remove ${id}`}
                    className="size-5"
                    onPress={() => onRemove(id)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <XIcon className="size-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <Select
                aria-label="Package manager"
                onSelectionChange={(key) => setPm(key as PackageManager)}
                selectedKey={pm}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <Popover className="rounded-md border bg-fd-popover p-1 shadow-md">
                  <ListBox>
                    <ListBoxItem
                      className="cursor-pointer rounded-sm px-3 py-1.5 text-sm outline-none hover:bg-fd-accent focus:bg-fd-accent"
                      id="bun"
                    >
                      bun
                    </ListBoxItem>
                    <ListBoxItem
                      className="cursor-pointer rounded-sm px-3 py-1.5 text-sm outline-none hover:bg-fd-accent focus:bg-fd-accent"
                      id="npm"
                    >
                      npm
                    </ListBoxItem>
                    <ListBoxItem
                      className="cursor-pointer rounded-sm px-3 py-1.5 text-sm outline-none hover:bg-fd-accent focus:bg-fd-accent"
                      id="yarn"
                    >
                      yarn
                    </ListBoxItem>
                    <ListBoxItem
                      className="cursor-pointer rounded-sm px-3 py-1.5 text-sm outline-none hover:bg-fd-accent focus:bg-fd-accent"
                      id="pnpm"
                    >
                      pnpm
                    </ListBoxItem>
                  </ListBox>
                </Popover>
              </Select>

              <Select
                aria-label="Install mode"
                onSelectionChange={(key) => setMode(key as InstallMode)}
                selectedKey={mode}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <Popover className="rounded-md border bg-fd-popover p-1 shadow-md">
                  <ListBox>
                    <ListBoxItem
                      className="cursor-pointer rounded-sm px-3 py-1.5 text-sm outline-none hover:bg-fd-accent focus:bg-fd-accent"
                      id="local"
                    >
                      Local
                    </ListBoxItem>
                    <ListBoxItem
                      className="cursor-pointer rounded-sm px-3 py-1.5 text-sm outline-none hover:bg-fd-accent focus:bg-fd-accent"
                      id="remote"
                    >
                      Remote
                    </ListBoxItem>
                  </ListBox>
                </Popover>
              </Select>
            </div>

            <div className="flex items-center gap-2 rounded-md border bg-fd-muted px-3 py-2">
              <code className="flex-1 text-sm">{command}</code>
              <CopyButton text={command} />
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="container pb-4">
          <Button className="shadow-lg" onPress={() => setIsOpen(true)}>
            <ShoppingBagIcon className="mr-2 size-4" />
            Bag ({items.length})
          </Button>
        </div>
      )}
    </div>
  );
}
