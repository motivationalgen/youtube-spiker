import { Scissors } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";

type Props = {
  duration: number;
  range: [number, number];
  disabled: boolean;
  onRangeChange: (range: [number, number]) => void;
};

export function TrimTimeline({ duration, range, disabled, onRangeChange }: Props) {
  const selected = Math.max(0, range[1] - range[0]);
  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scissors className="h-4 w-4" /> Trim Timeline <ReadLabelButton label="Trim Timeline" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border bg-muted/30 p-4">
          <div className="min-w-[620px] space-y-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(0)}</span>
              <span>Scroll timeline and drag handles</span>
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
                onRangeChange([Math.max(0, start), Math.min(duration, end)]);
              }}
            />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md bg-background p-3"><p className="text-xs text-muted-foreground">Start</p><p className="font-semibold">{formatTime(range[0])}</p></div>
              <div className="rounded-md bg-background p-3"><p className="text-xs text-muted-foreground">End</p><p className="font-semibold">{formatTime(range[1])}</p></div>
              <div className="rounded-md bg-background p-3"><p className="text-xs text-muted-foreground">Selected</p><p className="font-semibold">{formatTime(selected)}</p></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
