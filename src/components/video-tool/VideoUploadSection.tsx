import { useRef, useState } from "react";
import { Upload, Film, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acceptedVideoTypes, formatBytes, formatTime, MAX_VIDEO_SIZE } from "./helpers";
import { ReadLabelButton } from "./ReadLabelButton";
import type { VideoMetadata } from "./types";

type Props = {
  file: File | null;
  previewUrl: string | null;
  metadata: VideoMetadata | null;
  onVideoReady: (file: File, url: string, metadata: VideoMetadata) => void;
  onError: (message: string) => void;
};

export function VideoUploadSection({ file, previewUrl, metadata, onVideoReady, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (selected?: File) => {
    if (!selected) return;
    const validExtension = /\.(mp4|mov|avi|mkv|webm)$/i.test(selected.name);
    if (!acceptedVideoTypes.includes(selected.type) && !validExtension) {
      onError("Unsupported format. Upload MP4, MOV, AVI, MKV, or WEBM.");
      return;
    }
    if (selected.size > MAX_VIDEO_SIZE) {
      onError("This file is very large. Please use a video under 700 MB for browser processing.");
      return;
    }

    const url = URL.createObjectURL(selected);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      onVideoReady(selected, url, {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: selected.size,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      onError("Could not read the video metadata. Try another file.");
    };
    video.src = url;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" /> Upload Video <ReadLabelButton label="Upload Video" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`w-full rounded-xl border border-dashed p-6 text-center transition ${dragging ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:bg-muted/50"}`}
        >
          <Film className="mx-auto mb-3 h-10 w-10 text-primary" />
          <span className="block text-sm font-medium">Drop your video here or click to upload</span>
          <span className="mt-1 block text-xs text-muted-foreground">MP4, MOV, AVI, MKV, WEBM up to 700 MB</span>
        </button>
        <input ref={inputRef} type="file" accept=".mp4,.mov,.avi,.mkv,.webm,video/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

        {previewUrl && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
            <video src={previewUrl} controls className="aspect-video w-full rounded-lg border bg-muted object-contain" />
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="secondary">Ready</Badge>
                <span className="truncate text-sm font-medium">{file?.name}</span>
              </div>
              {metadata && (
                <dl className="grid gap-3 text-sm">
                  <div><dt className="text-muted-foreground">Duration</dt><dd className="font-medium">{formatTime(metadata.duration)}</dd></div>
                  <div><dt className="text-muted-foreground">Resolution</dt><dd className="font-medium">{metadata.width}×{metadata.height}</dd></div>
                  <div><dt className="text-muted-foreground">File size</dt><dd className="font-medium">{formatBytes(metadata.size)}</dd></div>
                </dl>
              )}
            </div>
          </div>
        )}

        {!previewUrl && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><AlertCircle className="h-3.5 w-3.5" /> Processing controls unlock after upload.</p>
        )}
      </CardContent>
    </Card>
  );
}
