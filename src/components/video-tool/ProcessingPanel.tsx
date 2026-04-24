import { Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ReadLabelButton } from "./ReadLabelButton";

type Props = {
  disabled: boolean;
  processing: boolean;
  progress: number;
  error: string;
  autoClipCount: number;
  onProcess: () => void;
};

export function ProcessingPanel({ disabled, processing, progress, error, autoClipCount, onProcess }: Props) {
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
          {processing ? "Processing video..." : autoClipCount > 0 ? `Process ${autoClipCount} Clips` : "Process Video"}
        </Button>
        {processing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-medium">{Math.round(progress)}%</span></div>
            <Progress value={progress} />
          </div>
        )}
        {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
