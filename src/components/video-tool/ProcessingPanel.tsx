import { Loader2, Wand2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ReadLabelButton } from "./ReadLabelButton";

type Props = {
  disabled: boolean;
  processing: boolean;
  progress: number;
  step?: string;
  error: string;
  autoClipCount: number;
  onProcess: () => void;
};

export function ProcessingPanel({ disabled, processing, progress, step, error, autoClipCount, onProcess }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4" /> Process & Optimize <ReadLabelButton label="Process and Optimize" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full sm:w-auto" disabled={disabled || processing} onClick={onProcess}>
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          {processing ? "Processing video…" : autoClipCount > 0 ? `Process ${autoClipCount} Clips` : "Process Video"}
        </Button>
        {(processing || progress > 0) && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{step || (processing ? "Working…" : "Ready")}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
        {error && (
          <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="break-words">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
