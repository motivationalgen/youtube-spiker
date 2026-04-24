import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compressionLabels } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";
import type { CompressionMode } from "./types";

type Props = { value: CompressionMode; disabled: boolean; onChange: (value: CompressionMode) => void };

export function CompressionSelector({ value, disabled, onChange }: Props) {
  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4" /> Compression <ReadLabelButton label="Compression" />
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(compressionLabels) as CompressionMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={`rounded-lg border p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:pointer-events-none ${value === mode ? "border-primary bg-primary/10" : "bg-background"}`}
          >
            <span className="block font-semibold">{compressionLabels[mode].label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{compressionLabels[mode].description}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
