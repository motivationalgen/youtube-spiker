import { useState } from "react";
import { Upload, Film, AlertCircle, Link } from "lucide-react";
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
  onVideoReady: (file: File, url: string, metadata: VideoMetadata, bytes: Uint8Array) => void;
  onError: (message: string) => void;
};

export function VideoUploadSection({ file, previewUrl, metadata, onVideoReady, onError }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [urlInput, setUrlInput] = useState("");
  const [fetchingLink, setFetchingLink] = useState(false);

  const handleFile = async (selected?: File) => {
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

    // Read the file IMMEDIATELY into memory while the user gesture is fresh.
    // On mobile browsers the File reference can later throw NotReadableError
    // ("permission problems that have occurred after a reference to a file was acquired").
    let bytes: Uint8Array;
    try {
      const buffer = await selected.arrayBuffer();
      bytes = new Uint8Array(buffer);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[video-tool] Could not read uploaded file", err);
      onError("Could not read this video. Try selecting it again.");
      return;
    }

    // Build a stable Blob/File from the bytes we already own — this no longer
    // depends on the original OS file handle, which may be revoked later.
    const stableBlob = new Blob([bytes.slice().buffer as ArrayBuffer], {
      type: selected.type || "video/mp4",
    });
    const stableFile = new File([stableBlob], selected.name, {
      type: selected.type || "video/mp4",
      lastModified: selected.lastModified,
    });

    const url = URL.createObjectURL(stableBlob);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      onVideoReady(stableFile, url, {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: stableFile.size,
      }, bytes);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      onError("Could not read the video metadata. Try another file.");
    };
    video.src = url;
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    
    // Check if it's a valid URL (basic check)
    try {
      new URL(urlInput);
    } catch {
      onError("Please enter a valid URL.");
      return;
    }

    setFetchingLink(true);
    
    // Simulate fetching video from URL
    setTimeout(() => {
      setFetchingLink(false);
      // Create a dummy video file blob to represent the downloaded video
      // In a real app, this would be the actual video downloaded from the backend proxy
      onError("Simulated fetch: URL upload requires a backend proxy to fetch videos due to CORS. In a production environment, this would download the video from the link.");
      setUrlInput("");
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" /> Upload Video <ReadLabelButton label="Upload Video" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewUrl && (
          <div className="flex rounded-md border p-1 mb-4">
            <button
              className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${uploadMode === "file" ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted"}`}
              onClick={() => setUploadMode("file")}
            >
              File Upload
            </button>
            <button
              className={`flex-1 rounded-sm py-1.5 text-sm font-medium transition-colors ${uploadMode === "link" ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted"}`}
              onClick={() => setUploadMode("link")}
            >
              Link Upload
            </button>
          </div>
        )}

        {uploadMode === "file" && !previewUrl && (
          <label
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            className={`relative block w-full cursor-pointer rounded-xl border border-dashed p-6 text-center transition ${dragging ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:bg-muted/50"}`}
          >
            <input type="file" accept=".mp4,.mov,.avi,.mkv,.webm,video/*" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => handleFile(e.target.files?.[0])} />
            <Film className="mx-auto mb-3 h-10 w-10 text-primary" />
            <span className="block text-sm font-medium">Drop your video here or click to upload</span>
            <span className="mt-1 block text-xs text-muted-foreground">MP4, MOV, AVI, MKV, WEBM up to 700 MB</span>
          </label>
        )}

        {uploadMode === "link" && !previewUrl && (
          <form onSubmit={handleLinkSubmit} className="space-y-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <Link className="mx-auto mb-3 h-10 w-10 text-primary" />
            <span className="block text-sm font-medium mb-4">Paste a YouTube or video link</span>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={fetchingLink}
              />
              <Button type="submit" disabled={fetchingLink || !urlInput}>
                {fetchingLink ? "Fetching..." : "Fetch"}
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Downloads the video from the provided link for processing.</p>
          </form>
        )}

        {previewUrl && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
            <video src={previewUrl} controls playsInline className="aspect-video w-full rounded-lg border bg-muted object-contain" />
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
