import { SplitSquareHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { buildAutoClips, formatTime } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";
import type { ClipRange } from "./types";

type Props = {
  duration: number;
  disabled: boolean;
  segmentSeconds: number;
  onSegmentSecondsChange: (seconds: number) => void;
  clips: ClipRange[];
};

export function AutoTrimSection({ duration, disabled, segmentSeconds, onSegmentSecondsChange, clips }: Props) {
  const tooShort = Boolean(duration && segmentSeconds > duration);
  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SplitSquareHorizontal className="h-4 w-4" /> Auto Trim Mode <ReadLabelButton label="Auto Trim Mode" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="segment-minutes">Segment length in minutes</Label>
            <Input
              id="segment-minutes"
              disabled={disabled}
              type="number"
              min="0.05"
              step="0.05"
              value={segmentSeconds ? String(segmentSeconds / 60) : ""}
              placeholder="1"
              onChange={(e) => onSegmentSecondsChange(Math.max(0, Number(e.target.value) * 60))}
            />
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Generated clips</p>
            <p className="text-2xl font-bold">{clips.length}</p>
          </div>
        </div>
        {tooShort && <p className="text-sm text-destructive">Segment length is longer than this video.</p>}
        {clips.length > 0 && (
          <div className="max-h-44 space-y-2 overflow-auto rounded-lg border p-3">
            {clips.map((clip) => (
              <div key={clip.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
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
