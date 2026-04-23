import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/thumbnail-tool")({
  component: ThumbnailToolPage,
  head: () => ({
    meta: [
      { title: "Thumbnail Tool — YouTube Growth Suite" },
      { name: "description", content: "Extract and preview YouTube video thumbnails" },
    ],
  }),
});

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const sizes = [
  { label: "Max Resolution", key: "maxresdefault", w: 1280, h: 720 },
  { label: "High Quality", key: "hqdefault", w: 480, h: 360 },
  { label: "Medium Quality", key: "mqdefault", w: 320, h: 180 },
  { label: "Standard", key: "sddefault", w: 640, h: 480 },
] as const;

function ThumbnailToolPage() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleExtract = () => {
    const id = extractVideoId(url);
    if (!id) {
      toast.error("Invalid YouTube URL. Please paste a valid video link.");
      return;
    }
    setVideoId(id);
    toast.success("Thumbnail extracted!");
  };

  const handleDownload = async (key: string) => {
    if (!videoId) return;
    const imgUrl = `https://img.youtube.com/vi/${videoId}/${key}.jpg`;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `thumbnail-${videoId}-${key}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Download started!");
    } catch {
      toast.error("Failed to download thumbnail");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thumbnail Tool</h1>
        <p className="text-muted-foreground mt-1">Extract and preview YouTube video thumbnails</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" /> Paste Video URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yt-url">YouTube Video URL</Label>
            <Input
              id="yt-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleExtract} className="w-full">Extract Thumbnail</Button>
        </CardContent>
      </Card>

      {videoId && (
        <div className="space-y-4">
          {sizes.map((size) => (
            <Card key={size.key}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{size.label} ({size.w}×{size.h})</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://img.youtube.com/vi/${videoId}/${size.key}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(size.key)}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={`https://img.youtube.com/vi/${videoId}/${size.key}.jpg`}
                  alt={`Thumbnail ${size.label}`}
                  className="w-full rounded-lg border"
                  loading="lazy"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
