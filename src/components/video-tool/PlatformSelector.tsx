import { MonitorSmartphone, Crop, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformPresets } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";
import type { FitMode, PlatformPreset, VideoMetadata } from "./types";

type Props = {
  selected: PlatformPreset;
  metadata: VideoMetadata | null;
  disabled: boolean;
  onSelect: (preset: PlatformPreset) => void;
  fit: FitMode;
  onFitChange: (fit: FitMode) => void;
  customCrop?: { x: number; y: number };
  onCustomCropChange?: (crop: { x: number; y: number }) => void;
};

export function PlatformSelector({ selected, metadata, disabled, onSelect, fit, onFitChange, customCrop = { x: 50, y: 50 }, onCustomCropChange }: Props) {
  const [rw, rh] = selected.ratio.split(":").map(Number);
  const overlayStyle =
    selected.ratio === "9:16"
      ? "h-full max-h-full aspect-[9/16]"
      : selected.ratio === "1:1"
        ? "h-[78%] max-h-full aspect-square"
        : "w-full max-w-full aspect-video";

  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorSmartphone className="h-4 w-4" /> Platform Resize <ReadLabelButton label="Platform Resize" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="space-y-2">
          <p className="text-sm font-medium">Fit mode</p>
          <div className="inline-flex w-full overflow-hidden rounded-lg border sm:w-auto">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFitChange("crop")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm transition sm:flex-none ${fit === "crop" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <Crop className="h-4 w-4" /> Smart crop
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFitChange("custom")}
              className={`flex flex-1 items-center justify-center gap-2 border-l px-4 py-2 text-sm transition sm:flex-none ${fit === "custom" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <Crop className="h-4 w-4" /> Custom Position
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {fit === "crop"
              ? "Fills the full target size by center-cropping. No bars, no stretching."
              : fit === "custom"
              ? "Choose the exact area of the video to focus on."
              : "Keeps the entire frame visible and adds black bars where needed."}
          </p>
        </div>

        {fit === "custom" && (
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Horizontal Position (X)</span>
                <span>{customCrop.x}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={customCrop.x}
                onChange={(e) => onCustomCropChange?.({ ...customCrop, x: Number(e.target.value) })}
                className="w-full"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vertical Position (Y)</span>
                <span>{customCrop.y}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={customCrop.y}
                onChange={(e) => onCustomCropChange?.({ ...customCrop, y: Number(e.target.value) })}
                className="w-full"
                disabled={disabled}
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted/40 p-4">
            <div className={`flex max-h-full max-w-full items-center justify-center border-2 border-primary bg-primary/10 ${overlayStyle}`}>
              <span className="text-xs font-medium text-primary">{selected.ratio} {fit}</span>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Output target</p>
            <p className="mt-1 text-muted-foreground">{selected.width}×{selected.height}</p>
            {metadata && (
              <p className="mt-3 text-xs text-muted-foreground">
                Source: {metadata.width}×{metadata.height}. Output keeps {rw}:{rh} via {fit === "crop" ? "smart center crop" : "letterbox padding"}.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
