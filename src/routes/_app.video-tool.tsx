import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Video, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoUploadSection } from "@/components/video-tool/VideoUploadSection";
import { TrimTimeline } from "@/components/video-tool/TrimTimeline";
import { AutoTrimSection } from "@/components/video-tool/AutoTrimSection";
import { PlatformSelector } from "@/components/video-tool/PlatformSelector";
import { FormatSelector } from "@/components/video-tool/FormatSelector";
import { CompressionSelector } from "@/components/video-tool/CompressionSelector";
import { ProcessingPanel } from "@/components/video-tool/ProcessingPanel";
import { DownloadPanel } from "@/components/video-tool/DownloadPanel";
import { buildAutoClips, compressionLabels, platformPresets } from "@/components/video-tool/helpers";
import type { ClipRange, CompressionMode, OutputFormat, PlatformPreset, ProcessedClip, VideoMetadata } from "@/components/video-tool/types";

export const Route = createFileRoute("/_app/video-tool")({
  component: VideoToolPage,
  head: () => ({
    meta: [
      { title: "Free Online Video Trimmer, Resizer & Converter" },
      { name: "description", content: "Trim, split, resize, compress, convert, and export videos for YouTube, TikTok, Instagram, Facebook, and Twitter/X." },
      { property: "og:title", content: "Free Online Video Trimmer, Resizer & Converter" },
      { property: "og:description", content: "A fast all-in-one creator video tool for trimming, platform resizing, format conversion, compression, and downloads." },
    ],
  }),
});

function inputName(file: File) {
  const extension = file.name.split(".").pop() || "mp4";
  return `input.${extension.toLowerCase()}`;
}

function outputName(index: number, format: OutputFormat, multiple: boolean) {
  const extension = format === "gif" ? "gif" : format;
  return multiple ? `clip-${String(index + 1).padStart(2, "0")}.${extension}` : `processed-video.${extension}`;
}

function buildFfmpegArgs(input: string, output: string, clip: ClipRange, preset: PlatformPreset, format: OutputFormat, compression: CompressionMode) {
  const duration = Math.max(0.2, clip.end - clip.start);
  const scalePad = `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`;
  if (format === "gif") {
    return ["-ss", String(clip.start), "-t", String(duration), "-i", input, "-vf", `fps=12,${scalePad}`, "-loop", "0", output];
  }
  if (format === "webm") {
    return ["-ss", String(clip.start), "-t", String(duration), "-i", input, "-vf", scalePad, "-c:v", "libvpx-vp9", "-b:v", compression === "small" ? "900k" : compression === "high" ? "3500k" : "1800k", "-c:a", "libopus", output];
  }
  return ["-ss", String(clip.start), "-t", String(duration), "-i", input, "-vf", scalePad, "-c:v", "libx264", "-preset", "veryfast", "-crf", String(compressionLabels[compression].crf), "-c:a", "aac", "-movflags", "+faststart", output];
}

async function loadFfmpeg(onProgress: (progress: number) => void) {
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => onProgress(Math.min(98, Math.max(1, progress * 100))));
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return { ffmpeg, fetchFile };
}

function VideoToolPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [segmentSeconds, setSegmentSeconds] = useState(0);
  const [platform, setPlatform] = useState(platformPresets[0]);
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [compression, setCompression] = useState<CompressionMode>("balanced");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<ProcessedClip[]>([]);

  const autoClips = useMemo(() => buildAutoClips(metadata?.duration || 0, segmentSeconds), [metadata?.duration, segmentSeconds]);
  const disabled = !file || !metadata || processing;

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    outputs.forEach((clip) => URL.revokeObjectURL(clip.url));
  }, [previewUrl, outputs]);

  const handleVideoReady = (nextFile: File, url: string, nextMetadata: VideoMetadata) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    outputs.forEach((clip) => URL.revokeObjectURL(clip.url));
    setFile(nextFile);
    setPreviewUrl(url);
    setMetadata(nextMetadata);
    setRange([0, nextMetadata.duration]);
    setSegmentSeconds(0);
    setOutputs([]);
    setError("");
    toast.success("Video loaded");
  };

  const handleError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const processVideo = async () => {
    if (!file || !metadata) return;
    if (format === "gif" && (range[1] - range[0] > 15) && autoClips.length === 0) {
      handleError("GIF exports should be 15 seconds or shorter. Trim the video or choose another format.");
      return;
    }
    const ranges: ClipRange[] = autoClips.length > 0 ? autoClips : [{ id: "single", label: "Processed video", start: range[0], end: range[1] }];
    if (ranges.some((clip) => clip.end <= clip.start)) {
      handleError("Choose a valid trim range before processing.");
      return;
    }

    setProcessing(true);
    setError("");
    setProgress(1);
    outputs.forEach((clip) => URL.revokeObjectURL(clip.url));
    setOutputs([]);

    try {
      const { ffmpeg, fetchFile } = await loadFfmpeg(setProgress);
      const sourceName = inputName(file);
      await ffmpeg.writeFile(sourceName, await fetchFile(file));
      const processed: ProcessedClip[] = [];

      for (let i = 0; i < ranges.length; i += 1) {
        const clip = ranges[i];
        const outName = outputName(i, format, ranges.length > 1);
        setProgress(Math.max(3, (i / ranges.length) * 90));
        await ffmpeg.exec(buildFfmpegArgs(sourceName, outName, clip, platform, format, compression));
        const data = await ffmpeg.readFile(outName);
        const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
        const blob = new Blob([bytes], { type: format === "gif" ? "image/gif" : `video/${format === "mov" ? "quicktime" : format}` });
        processed.push({ ...clip, blob, url: URL.createObjectURL(blob), filename: outName });
        await ffmpeg.deleteFile(outName);
      }

      await ffmpeg.deleteFile(sourceName);
      ffmpeg.terminate();
      setOutputs(processed);
      setProgress(100);
      toast.success(processed.length > 1 ? "Clips are ready" : "Video is ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed. Try a shorter clip or smaller file.";
      setError(message.includes("memory") ? "This video is too large for browser processing on this device." : message);
      toast.error("Video processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary"><Video className="h-4 w-4" /> All-in-One Video Tool</div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Free Online Video Trimmer, Resizer & Converter</h1>
        <p className="max-w-3xl text-muted-foreground">Upload your own video, trim it, split clips, resize for social platforms, convert formats, optimize, and download without external video downloading.</p>
      </header>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>Processing runs in your browser and loads the video engine only when needed. Large files may take longer depending on your device.</p>
        </CardContent>
      </Card>

      <VideoUploadSection file={file} previewUrl={previewUrl} metadata={metadata} onVideoReady={handleVideoReady} onError={handleError} />
      <TrimTimeline duration={metadata?.duration || 0} range={range} disabled={disabled} onRangeChange={setRange} />
      <AutoTrimSection duration={metadata?.duration || 0} disabled={disabled} segmentSeconds={segmentSeconds} onSegmentSecondsChange={setSegmentSeconds} clips={autoClips} />
      <PlatformSelector selected={platform} metadata={metadata} disabled={disabled} onSelect={setPlatform} />
      <div className="grid gap-6 xl:grid-cols-2">
        <FormatSelector value={format} disabled={disabled} onChange={setFormat} />
        <CompressionSelector value={compression} disabled={disabled} onChange={setCompression} />
      </div>
      <ProcessingPanel disabled={disabled} processing={processing} progress={progress} error={error} autoClipCount={autoClips.length} onProcess={processVideo} />
      <DownloadPanel clips={outputs} />
    </main>
  );
}
