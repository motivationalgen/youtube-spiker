import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type {
  ClipRange,
  CompressionMode,
  FitMode,
  OutputFormat,
  PlatformPreset,
  ProcessedClip,
  VideoMetadata,
} from "@/components/video-tool/types";

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

function buildVideoFilter(preset: PlatformPreset, fit: FitMode) {
  if (fit === "crop") {
    // Smart fill: scale up and center-crop, no bars.
    return `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=increase,crop=${preset.width}:${preset.height}`;
  }
  // Fit with letterbox / pillarbox padding, full frame preserved.
  return `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2:color=black`;
}

function buildFfmpegArgs(
  input: string,
  output: string,
  clip: ClipRange,
  preset: PlatformPreset,
  format: OutputFormat,
  compression: CompressionMode,
  fit: FitMode,
) {
  const duration = Math.max(0.2, clip.end - clip.start);
  const vf = buildVideoFilter(preset, fit);
  const startArgs = ["-ss", String(clip.start), "-t", String(duration), "-i", input];
  if (format === "gif") {
    return [...startArgs, "-vf", `fps=12,${vf}`, "-loop", "0", output];
  }
  if (format === "webm") {
    const bitrate = compression === "small" ? "900k" : compression === "high" ? "3500k" : "1800k";
    return [...startArgs, "-vf", vf, "-c:v", "libvpx-vp9", "-b:v", bitrate, "-c:a", "libopus", output];
  }
  // mp4 / mov
  return [
    ...startArgs,
    "-vf", vf,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", String(compressionLabels[compression].crf),
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    output,
  ];
}

const FFMPEG_VERSION = "0.12.10";
const FFMPEG_CORE_VERSION = "0.12.6";
// Each entry: [coreBase, classWorkerBase] — the classWorker comes from @ffmpeg/ffmpeg, core from @ffmpeg/core.
const CDN_SOURCES = [
  {
    core: `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
    worker: `https://unpkg.com/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd`,
  },
  {
    core: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`,
    worker: `https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@${FFMPEG_VERSION}/dist/umd`,
  },
];

async function loadFfmpeg(
  onProgress: (value: number) => void,
  onStep: (label: string) => void,
  onLog: (entry: string) => void,
) {
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);
  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => {
    if (Number.isFinite(progress) && progress > 0) {
      onProgress(Math.min(98, Math.max(1, progress * 100)));
    }
  });
  ffmpeg.on("log", ({ message }) => {
    onLog(message);
    // eslint-disable-next-line no-console
    console.log("[ffmpeg]", message);
  });

  let lastErr: unknown = null;
  for (const source of CDN_SOURCES) {
    try {
      onStep(`Loading engine from ${new URL(source.core).hostname}…`);
      // eslint-disable-next-line no-console
      console.log("[video-tool] Fetching ffmpeg core from", source.core);
      const [coreURL, wasmURL, classWorkerURL] = await Promise.all([
        toBlobURL(`${source.core}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${source.core}/ffmpeg-core.wasm`, "application/wasm"),
        toBlobURL(`${source.worker}/814.ffmpeg.js`, "text/javascript"),
      ]);
      onProgress(5);
      await ffmpeg.load({ coreURL, wasmURL, classWorkerURL });
      onProgress(10);
      // eslint-disable-next-line no-console
      console.log("[video-tool] ffmpeg loaded successfully");
      return { ffmpeg, fetchFile };
    } catch (err) {
      lastErr = err;
      // eslint-disable-next-line no-console
      console.warn("[video-tool] CDN failed, trying next:", source.core, err);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to load video engine from all CDNs.");
}

function VideoToolPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [segmentSeconds, setSegmentSeconds] = useState(0);
  const [platform, setPlatform] = useState(platformPresets[0]);
  const [fit, setFit] = useState<FitMode>("crop");
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [compression, setCompression] = useState<CompressionMode>("balanced");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<ProcessedClip[]>([]);

  const previewUrlRef = useRef<string | null>(null);
  const outputsRef = useRef<ProcessedClip[]>([]);
  previewUrlRef.current = previewUrl;
  outputsRef.current = outputs;

  const autoClips = useMemo(
    () => buildAutoClips(metadata?.duration || 0, segmentSeconds),
    [metadata?.duration, segmentSeconds],
  );
  const disabled = !file || !metadata || processing;

  // Mount-only cleanup. Revoke the *latest* known URLs when the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      outputsRef.current.forEach((clip) => URL.revokeObjectURL(clip.url));
    };
  }, []);

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
    setStep("");
    setProgress(0);
    toast.success("Video loaded");
    // eslint-disable-next-line no-console
    console.log("[video-tool] Loaded", nextFile.name, nextMetadata);
  };

  const handleError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const processVideo = async () => {
    if (!file || !metadata) return;
    if (format === "gif" && range[1] - range[0] > 15 && autoClips.length === 0) {
      handleError("GIF exports should be 15 seconds or shorter. Trim the video or choose another format.");
      return;
    }
    const ranges: ClipRange[] = autoClips.length > 0
      ? autoClips
      : [{ id: "single", label: "Processed video", start: range[0], end: range[1] }];
    if (ranges.some((clip) => clip.end <= clip.start)) {
      handleError("Choose a valid trim range before processing.");
      return;
    }

    setProcessing(true);
    setError("");
    setProgress(1);
    setStep("Preparing…");
    outputs.forEach((clip) => URL.revokeObjectURL(clip.url));
    setOutputs([]);

    const logBuffer: string[] = [];
    const pushLog = (entry: string) => {
      logBuffer.push(entry);
      if (logBuffer.length > 40) logBuffer.shift();
    };

    let ffmpegInstance: Awaited<ReturnType<typeof loadFfmpeg>>["ffmpeg"] | null = null;
    try {
      const { ffmpeg, fetchFile } = await loadFfmpeg(setProgress, setStep, pushLog);
      ffmpegInstance = ffmpeg;
      const sourceName = inputName(file);
      setStep("Loading video into engine…");
      setProgress(12);
      // eslint-disable-next-line no-console
      console.log("[video-tool] Writing input file", sourceName);
      await ffmpeg.writeFile(sourceName, await fetchFile(file));
      setProgress(15);

      const processed: ProcessedClip[] = [];
      for (let i = 0; i < ranges.length; i += 1) {
        const clip = ranges[i];
        const outName = outputName(i, format, ranges.length > 1);
        setStep(ranges.length > 1 ? `Encoding clip ${i + 1} of ${ranges.length}…` : "Encoding video…");
        const clipStartProgress = 15 + (i / ranges.length) * 80;
        setProgress(Math.max(clipStartProgress, 15));
        const args = buildFfmpegArgs(sourceName, outName, clip, platform, format, compression, fit);
        // eslint-disable-next-line no-console
        console.log("[video-tool] ffmpeg.exec", args);
        const code = await ffmpeg.exec(args);
        if (code !== 0) {
          const tail = logBuffer.slice(-3).join(" | ");
          throw new Error(`Encoding failed (exit ${code}). ${tail}`);
        }
        setProgress(Math.min(95, 15 + ((i + 0.8) / ranges.length) * 80));
        const data = await ffmpeg.readFile(outName);
        const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
        if (bytes.byteLength === 0) {
          throw new Error("Output file was empty. Try a different format or shorter clip.");
        }
        const mime = format === "gif"
          ? "image/gif"
          : format === "mov"
            ? "video/quicktime"
            : format === "webm"
              ? "video/webm"
              : "video/mp4";
        const safeBuffer = bytes.slice().buffer as ArrayBuffer;
        const blob = new Blob([safeBuffer], { type: mime });
        processed.push({ ...clip, blob, url: URL.createObjectURL(blob), filename: outName });
        try {
          await ffmpeg.deleteFile(outName);
        } catch (cleanupErr) {
          // eslint-disable-next-line no-console
          console.warn("[video-tool] Could not delete temp file", outName, cleanupErr);
        }
        setProgress(Math.min(98, 15 + ((i + 1) / ranges.length) * 80));
      }

      try {
        await ffmpeg.deleteFile(sourceName);
      } catch {
        /* ignore */
      }

      setOutputs(processed);
      setProgress(100);
      setStep("Done");
      toast.success(processed.length > 1 ? "Clips are ready" : "Video is ready");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[video-tool] Processing failed", err, logBuffer.slice(-5));
      const raw = err instanceof Error ? err.message : "Processing failed.";
      const message = /memory|allocation|OOM/i.test(raw)
        ? "This video is too large for browser processing on this device. Try trimming first or using a smaller resolution."
        : raw;
      setError(message);
      setStep("Failed");
      toast.error("Video processing failed");
    } finally {
      try {
        ffmpegInstance?.terminate();
      } catch {
        /* ignore */
      }
      setProcessing(false);
    }
  };

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Video className="h-4 w-4" /> All-in-One Video Tool
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Free Online Video Trimmer, Resizer & Converter</h1>
        <p className="max-w-3xl text-muted-foreground">
          Upload your own video, trim it, split clips, resize for social platforms, convert formats, optimize, and download — all in your browser.
        </p>
      </header>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>Processing runs in your browser and loads the video engine only when needed. Large files may take longer depending on your device.</p>
        </CardContent>
      </Card>

      <VideoUploadSection file={file} previewUrl={previewUrl} metadata={metadata} onVideoReady={handleVideoReady} onError={handleError} />
      <TrimTimeline duration={metadata?.duration || 0} range={range} disabled={disabled} onRangeChange={setRange} />
      <AutoTrimSection
        duration={metadata?.duration || 0}
        disabled={disabled}
        segmentSeconds={segmentSeconds}
        onSegmentSecondsChange={setSegmentSeconds}
        clips={autoClips}
      />
      <PlatformSelector
        selected={platform}
        metadata={metadata}
        disabled={disabled}
        onSelect={setPlatform}
        fit={fit}
        onFitChange={setFit}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <FormatSelector value={format} disabled={disabled} onChange={setFormat} />
        <CompressionSelector value={compression} disabled={disabled} onChange={setCompression} />
      </div>
      <ProcessingPanel
        disabled={disabled}
        processing={processing}
        progress={progress}
        step={step}
        error={error}
        autoClipCount={autoClips.length}
        onProcess={processVideo}
      />
      <DownloadPanel clips={outputs} />
    </main>
  );
}
