import { MonitorSmartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformPresets } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";
import type { PlatformPreset, VideoMetadata } from "./types";

type Props = {
  selected: PlatformPreset;
  metadata: VideoMetadata | null;
  disabled: boolean;
  onSelect: (preset: PlatformPreset) => void;
};

export function PlatformSelector({ selected, metadata, disabled, onSelect }: Props) {
  const [rw, rh] = selected.ratio.split(":").map(Number);
  const overlayStyle = selected.ratio === "9:16" ? "h-full aspect-[9/16]" : selected.ratio === "1:1" ? "h-[78%] aspect-square" : "w-full aspect-video";

  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorSmartphone className="h-4 w-4" /> Platform Resize <ReadLabelButton label="Platform Resize" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platformPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(preset)}
              className={`rounded-lg border p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:pointer-events-none ${selected.id === preset.id ? "border-primary bg-primary/10 shadow-sm" : "bg-background"}`}
            >
              <span className="block font-semibold">{preset.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{preset.ratio} • {preset.width}×{preset.height}</span>
              <span className="mt-2 block text-xs">{preset.note}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted/40 p-4">
            <div className={`flex max-h-full max-w-full items-center justify-center border-2 border-primary bg-primary/10 ${overlayStyle}`}>
              <span className="text-xs font-medium text-primary">{selected.ratio} crop</span>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Output target</p>
            <p className="mt-1 text-muted-foreground">{selected.width}×{selected.height}</p>
            {metadata && <p className="mt-3 text-xs text-muted-foreground">Source: {metadata.width}×{metadata.height}. FFmpeg will scale and pad to keep the full frame inside {rw}:{rh}.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
