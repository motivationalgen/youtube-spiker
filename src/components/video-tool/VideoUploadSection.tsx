import { useState } from "react";
import { Upload, Film, AlertCircle, Link } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadLabelButton } from "./ReadLabelButton";
import { createVideoPreview, validateVideoFile } from "./preview";
import { VideoPreview } from "./VideoPreview";
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

    const validationError = validateVideoFile(selected);
    if (validationError) {
      onError(validationError);
      return;
    }

    try {
      const preview = await createVideoPreview(selected);
      onVideoReady(preview.file, preview.previewUrl, preview.metadata, preview.bytes);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[video-tool] Could not create video preview", err);
      onError(err instanceof Error ? err.message : "Could not read this video. Try selecting it again.");
    }
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

        {previewUrl && <VideoPreview file={file} previewUrl={previewUrl} metadata={metadata} />}

        {!previewUrl && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><AlertCircle className="h-3.5 w-3.5" /> Processing controls unlock after upload.</p>
        )}
      </CardContent>
    </Card>
  );
}
