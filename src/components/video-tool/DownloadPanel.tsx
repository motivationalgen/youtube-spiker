import { Download, Package, CheckCircle2 } from "lucide-react";
import { zipSync } from "fflate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBytes, formatTime } from "./helpers";
import type { ProcessedClip } from "./types";

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function DownloadPanel({ clips }: { clips: ProcessedClip[] }) {
  if (clips.length === 0) return null;

  const totalBytes = clips.reduce((sum, c) => sum + c.blob.size, 0);

  const downloadZip = async () => {
    const entries: Record<string, Uint8Array> = {};
    for (const clip of clips) {
      entries[clip.filename] = new Uint8Array(await clip.blob.arrayBuffer());
    }
    const zipped = zipSync(entries);
    const url = URL.createObjectURL(new Blob([zipped], { type: "application/zip" }));
    downloadUrl(url, "video-tool-clips.zip");
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="h-4 w-4" /> Download
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="font-medium">{clips.length} {clips.length === 1 ? "clip" : "clips"} ready</span>
            <span className="text-muted-foreground">• {formatBytes(totalBytes)} total</span>
          </div>
        </div>
        {clips.length === 1 ? (
          <Button className="w-full sm:w-auto" onClick={() => downloadUrl(clips[0].url, clips[0].filename)}>
            <Download className="h-4 w-4" /> Download Video
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={downloadZip}>
            <Package className="h-4 w-4" /> Download All as ZIP
          </Button>
        )}
        <div className="space-y-2">
          {clips.map((clip) => (
            <div key={clip.id} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{clip.label}</p>
                <p className="text-xs text-muted-foreground">{formatTime(clip.start)} – {formatTime(clip.end)} • {formatBytes(clip.blob.size)}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => downloadUrl(clip.url, clip.filename)}>
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
