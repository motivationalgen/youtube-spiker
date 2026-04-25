import { Scissors, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";

type Props = {
  duration: number;
  range: [number, number];
  disabled: boolean;
  onRangeChange: (range: [number, number]) => void;
};

const NUDGE = 0.5;

export function TrimTimeline({ duration, range, disabled, onRangeChange }: Props) {
  const selected = Math.max(0, range[1] - range[0]);

  const clamp = (start: number, end: number): [number, number] => {
    const safeStart = Math.max(0, Math.min(start, duration - 0.2));
    const safeEnd = Math.max(safeStart + 0.2, Math.min(end, duration));
    return [safeStart, safeEnd];
  };

  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scissors className="h-4 w-4" /> Trim Timeline <ReadLabelButton label="Trim Timeline" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
          <div className="space-y-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(0)}</span>
              <span className="hidden sm:inline">Drag handles to set start and end</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Slider
              disabled={disabled}
              min={0}
              max={Math.max(duration, 1)}
              step={0.1}
              value={range}
              onValueChange={(value) => {
                const start = Math.min(value[0], value[1] - 0.2);
                const end = Math.max(value[1], start + 0.2);
                onRangeChange(clamp(start, end));
              }}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-background p-3">
                <p className="text-xs text-muted-foreground">Start</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-base font-semibold">{formatTime(range[0])}</p>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={disabled}
                      onClick={() => onRangeChange(clamp(range[0] - NUDGE, range[1]))}><Minus className="h-3.5 w-3.5" /></Button>
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={disabled}
                      onClick={() => onRangeChange(clamp(range[0] + NUDGE, range[1]))}><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-background p-3">
                <p className="text-xs text-muted-foreground">End</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-base font-semibold">{formatTime(range[1])}</p>
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={disabled}
                      onClick={() => onRangeChange(clamp(range[0], range[1] - NUDGE))}><Minus className="h-3.5 w-3.5" /></Button>
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" disabled={disabled}
                      onClick={() => onRangeChange(clamp(range[0], range[1] + NUDGE))}><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-background p-3">
                <p className="text-xs text-muted-foreground">Selected</p>
                <p className="mt-1 text-base font-semibold">{formatTime(selected)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
