import { Icon } from "@iconify/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { fetchIconSvg } from "../actions";
import { CopyButton } from "./copy-button";

interface IconDetailPanelProps {
  iconId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isInBag: boolean;
  onToggleBag: () => void;
}

export function IconDetailPanel({
  iconId,
  isOpen,
  onOpenChange,
  isInBag,
  onToggleBag,
}: IconDetailPanelProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(false);

  const handleCopySvg = useCallback(async () => {
    if (svg) {
      await navigator.clipboard.writeText(svg);
      return;
    }
    if (!iconId) {
      return;
    }
    const [prefix, name] = iconId.split(":");
    if (!(prefix && name)) {
      return;
    }
    setLoadingSvg(true);
    const result = await fetchIconSvg(prefix, name);
    setLoadingSvg(false);
    if (result) {
      await navigator.clipboard.writeText(result);
      setSvg(result);
    }
  }, [iconId, svg]);

  if (!iconId) {
    return null;
  }

  return (
    <Sheet.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Sheet.Overlay>
        <Sheet.Modal side="right">
          <Sheet.Content>
            <Sheet.Header>
              <Sheet.Title>{iconId}</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>

            <div className="flex flex-col items-center gap-6 px-6 py-8">
              <div className="flex items-center justify-center rounded-lg border bg-fd-background p-6">
                <Icon icon={iconId} style={{ width: 128, height: 128 }} />
              </div>

              <div className="flex w-full flex-col gap-3">
                <CopyButton
                  className="w-full"
                  label="Copy Icon ID"
                  text={iconId}
                />

                <Button
                  className="w-full"
                  isPending={loadingSvg}
                  onPress={handleCopySvg}
                  variant="outline"
                >
                  Copy SVG
                </Button>

                <Button
                  className="w-full"
                  onPress={onToggleBag}
                  variant={isInBag ? "secondary" : "default"}
                >
                  {isInBag ? "Remove from Bag" : "Add to Bag"}
                </Button>
              </div>
            </div>
          </Sheet.Content>
        </Sheet.Modal>
      </Sheet.Overlay>
    </Sheet.Root>
  );
}
