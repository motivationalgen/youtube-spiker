import { FileVideo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatLabels } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";
import type { OutputFormat } from "./types";

type Props = { value: OutputFormat; disabled: boolean; onChange: (value: OutputFormat) => void };

export function FormatSelector({ value, disabled, onChange }: Props) {
  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileVideo className="h-4 w-4" /> Format Converter <ReadLabelButton label="Format Converter" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup disabled={disabled} value={value} onValueChange={(next) => onChange(next as OutputFormat)} className="grid gap-3 sm:grid-cols-4">
          {(Object.keys(formatLabels) as OutputFormat[]).map((format) => (
            <Label key={format} className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background p-3 transition hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10">
              <RadioGroupItem value={format} />
              <span className="font-medium">{formatLabels[format]}</span>
            </Label>
          ))}
        </RadioGroup>
        {value === "gif" && <p className="mt-3 text-xs text-muted-foreground">GIF exports are best for short clips under 10 seconds.</p>}
      </CardContent>
    </Card>
  );
}
