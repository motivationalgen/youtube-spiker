import { useState, useEffect } from "react";
import { SplitSquareHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";
import type { ClipRange } from "./types";

type Props = {
  duration: number;
  disabled: boolean;
  segmentSeconds: number;
  onSegmentSecondsChange: (seconds: number) => void;
  clips: ClipRange[];
};

const PRESETS: Array<{ label: string; seconds: number }> = [
  { label: "Off", seconds: 0 },
  { label: "15s", seconds: 15 },
  { label: "30s", seconds: 30 },
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "5m", seconds: 300 },
];

export function AutoTrimSection({ duration, disabled, segmentSeconds, onSegmentSecondsChange, clips }: Props) {
  const matchesPreset = PRESETS.some((preset) => preset.seconds === segmentSeconds);
  const [customMode, setCustomMode] = useState(!matchesPreset && segmentSeconds > 0);
  const [customValue, setCustomValue] = useState(segmentSeconds > 0 ? String(segmentSeconds) : "");

  useEffect(() => {
    if (matchesPreset) {
      setCustomMode(false);
      setCustomValue("");
    }
  }, [matchesPreset]);

  const tooShort = Boolean(duration && segmentSeconds > duration);

  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SplitSquareHorizontal className="h-4 w-4" /> Auto Trim Mode <ReadLabelButton label="Auto Trim Mode" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Split video into equal clips</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const active = !customMode && segmentSeconds === preset.seconds;
              return (
                <button
                  key={preset.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setCustomMode(false);
                    setCustomValue("");
                    onSegmentSecondsChange(preset.seconds);
                  }}
                  className={`rounded-full border px-4 py-1.5 text-sm transition disabled:pointer-events-none ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary hover:bg-primary/5"}`}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setCustomMode(true)}
              className={`rounded-full border px-4 py-1.5 text-sm transition disabled:pointer-events-none ${customMode ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary hover:bg-primary/5"}`}
            >
              Custom
            </button>
          </div>
        </div>

        {customMode && (
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="segment-custom">Segment length (seconds)</Label>
            <Input
              id="segment-custom"
              disabled={disabled}
              type="number"
              min="1"
              step="1"
              value={customValue}
              placeholder="e.g. 45"
              onChange={(e) => {
                setCustomValue(e.target.value);
                const next = Math.max(0, Number(e.target.value));
                onSegmentSecondsChange(Number.isFinite(next) ? next : 0);
              }}
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Generated clips</p>
            <p className="text-2xl font-bold">{clips.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Segment length</p>
            <p className="text-2xl font-bold">{segmentSeconds > 0 ? formatTime(segmentSeconds) : "—"}</p>
          </div>
        </div>

        {tooShort && <p className="text-sm text-destructive">Segment length is longer than this video. Choose a shorter segment.</p>}

        {clips.length > 0 && (
          <div className="max-h-44 space-y-2 overflow-auto rounded-lg border p-3">
            {clips.map((clip) => (
              <div key={clip.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">{clip.label}</span>
                <Badge variant="secondary">{formatTime(clip.start)} – {formatTime(clip.end)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
