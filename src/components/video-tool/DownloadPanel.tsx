import { Download, Package } from "lucide-react";
import { zipSync } from "fflate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBytes, formatTime } from "./helpers";
import type { ProcessedClip } from "./types";

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export function DownloadPanel({ clips }: { clips: ProcessedClip[] }) {
  if (clips.length === 0) return null;

  const downloadZip = async () => {
    const entries: Record<string, Uint8Array> = {};
    for (const clip of clips) {
      entries[clip.filename] = new Uint8Array(await clip.blob.arrayBuffer());
    }
    const zipped = zipSync(entries);
    const zipBytes = new Uint8Array(zipped);
    const url = URL.createObjectURL(new Blob([zipBytes.buffer], { type: "application/zip" }));
    downloadUrl(url, "video-tool-clips.zip");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Download className="h-4 w-4" /> Download</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clips.length === 1 ? (
          <Button onClick={() => downloadUrl(clips[0].url, clips[0].filename)}><Download className="h-4 w-4" /> Download Video</Button>
        ) : (
          <Button onClick={downloadZip}><Package className="h-4 w-4" /> Download All as ZIP</Button>
        )}
        <div className="space-y-2">
          {clips.map((clip) => (
            <div key={clip.id} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{clip.label}</p>
                <p className="text-xs text-muted-foreground">{formatTime(clip.start)} – {formatTime(clip.end)} • {formatBytes(clip.blob.size)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadUrl(clip.url, clip.filename)}><Download className="h-3.5 w-3.5" /> Download</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
