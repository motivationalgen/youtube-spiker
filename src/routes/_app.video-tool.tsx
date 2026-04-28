import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Video, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoUploadSection } from "@/components/video-tool/VideoUploadSection";
import { TrimTimeline } from "@/components/video-tool/TrimTimeline";
import { AutoTrimSection } from "@/components/video-tool/AutoTrimSection";
import { TranscriptionSection } from "@/components/video-tool/TranscriptionSection";
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
  CustomCrop,
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

function buildVideoFilter(preset: PlatformPreset, fit: FitMode, customCrop?: CustomCrop) {
  if (fit === "crop") {
    // Smart fill: scale up and center-crop, no bars.
    return `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=increase,crop=${preset.width}:${preset.height}`;
  }
  if (fit === "custom" && customCrop) {
    // Custom crop based on percentage x and y
    // Scale up to cover the target area, then crop at specific X and Y
    const xExpr = `(in_w-out_w)*${customCrop.x}/100`;
    const yExpr = `(in_h-out_h)*${customCrop.y}/100`;
    return `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=increase,crop=${preset.width}:${preset.height}:${xExpr}:${yExpr}`;
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
  customCrop?: CustomCrop
) {
  const duration = Math.max(0.2, clip.end - clip.start);
  const vf = buildVideoFilter(preset, fit, customCrop);
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

const FFMPEG_CORE_VERSION = "0.12.9";
const ENGINE_SOURCES = [
  {
    label: "unpkg.com",
    coreURL: `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm/ffmpeg-core.js`,
    wasmURL: `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm/ffmpeg-core.wasm`,
  },
  {
    label: "cdn.jsdelivr.net",
    coreURL: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm/ffmpeg-core.js`,
    wasmURL: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm/ffmpeg-core.wasm`,
  },
];

async function readFileAsUint8Array(
  file: File,
  onProgress: (value: number) => void,
): Promise<Uint8Array> {
  // Modern, stream-backed read. Avoids FileReader "Code=-1" failures.
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // eslint-disable-next-line no-console
    console.log("[video-tool] Read", bytes.byteLength, "bytes from file (single-shot)");
    onProgress(15);
    return bytes;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[video-tool] Single-shot file read failed, falling back to chunked read", err);
  }

  // Chunked fallback for memory-constrained / unreliable environments.
  const CHUNK = 8 * 1024 * 1024; // 8 MB
  const total = file.size;
  const out = new Uint8Array(total);
  let offset = 0;
  while (offset < total) {
    const end = Math.min(offset + CHUNK, total);
    try {
      const chunkBuf = await file.slice(offset, end).arrayBuffer();
      out.set(new Uint8Array(chunkBuf), offset);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[video-tool] Chunked read failed at offset", offset, err);
      throw new Error(
        "Could not read the video file from your device. Try re-selecting the file or use a smaller video.",
      );
    }
    offset = end;
    onProgress(12 + Math.min(3, (offset / total) * 3));
  }
  // eslint-disable-next-line no-console
  console.log("[video-tool] Read", out.byteLength, "bytes from file (chunked)");
  return out;
}

async function loadFfmpeg(
  onProgress: (value: number) => void,
  onStep: (label: string) => void,
  onLog: (entry: string) => void,
) {
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
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
  for (const source of ENGINE_SOURCES) {
    let coreBlobURL = "";
    let wasmBlobURL = "";
    try {
      onStep(`Loading engine from ${source.label}…`);
      // eslint-disable-next-line no-console
      console.log("[video-tool] Loading ffmpeg core", source);
      coreBlobURL = await toBlobURL(source.coreURL, "text/javascript", true, ({ total, received }) => {
        onProgress(total > 0 ? 2 + Math.min(2, (received / total) * 2) : 3);
      });
      wasmBlobURL = await toBlobURL(source.wasmURL, "application/wasm", true, ({ total, received }) => {
        onProgress(total > 0 ? 4 + Math.min(5, (received / total) * 5) : 6);
      });
      onProgress(9);
      await ffmpeg.load({ coreURL: coreBlobURL, wasmURL: wasmBlobURL });
      onProgress(10);
      // eslint-disable-next-line no-console
      console.log("[video-tool] ffmpeg loaded successfully from", source.label);
      return { ffmpeg };
    } catch (err) {
      lastErr = err;
      // eslint-disable-next-line no-console
      console.warn("[video-tool] Engine source failed, trying next:", source.label, err);
    } finally {
      if (coreBlobURL) URL.revokeObjectURL(coreBlobURL);
      if (wasmBlobURL) URL.revokeObjectURL(wasmBlobURL);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to load the video engine.");
}

function VideoToolPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [segmentSeconds, setSegmentSeconds] = useState(0);
  const [platform, setPlatform] = useState(platformPresets[0]);
  const [fit, setFit] = useState<FitMode>("crop");
  const [customCrop, setCustomCrop] = useState<CustomCrop>({ x: 50, y: 50 });
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [compression, setCompression] = useState<CompressionMode>("balanced");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<ProcessedClip[]>([]);

  const previewUrlRef = useRef<string | null>(null);
  const outputsRef = useRef<ProcessedClip[]>([]);
  const fileBytesRef = useRef<Uint8Array | null>(null);
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

  const handleVideoReady = (
    nextFile: File,
    url: string,
    nextMetadata: VideoMetadata,
    bytes: Uint8Array,
  ) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    outputs.forEach((clip) => URL.revokeObjectURL(clip.url));
    fileBytesRef.current = bytes;
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
    console.log("[video-tool] Loaded", nextFile.name, nextMetadata, "bytes:", bytes.byteLength);
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
      const { ffmpeg } = await loadFfmpeg(setProgress, setStep, pushLog);
      ffmpegInstance = ffmpeg;
      const sourceName = inputName(file);
      setStep("Loading video into engine…");
      setProgress(12);
      // Use the bytes captured at upload time. The original File handle may
      // have been revoked by the browser by now (NotReadableError on mobile).
      let inputBytes = fileBytesRef.current;
      if (!inputBytes) {
        try {
          inputBytes = await readFileAsUint8Array(file, setProgress);
          fileBytesRef.current = inputBytes;
        } catch (readErr) {
          // eslint-disable-next-line no-console
          console.error("[video-tool] Fallback file read failed", readErr);
          throw new Error("Could not read the video file. Please re-upload it and try again.");
        }
      }
      // eslint-disable-next-line no-console
      console.log("[video-tool] Writing input file", sourceName, inputBytes.byteLength, "bytes");
      await ffmpeg.writeFile(sourceName, inputBytes);
      setProgress(15);

      const processed: ProcessedClip[] = [];
      for (let i = 0; i < ranges.length; i += 1) {
        const clip = ranges[i];
        const outName = outputName(i, format, ranges.length > 1);
        setStep(ranges.length > 1 ? `Encoding clip ${i + 1} of ${ranges.length}…` : "Encoding video…");
        const clipStartProgress = 15 + (i / ranges.length) * 80;
        setProgress(Math.max(clipStartProgress, 15));
        const args = buildFfmpegArgs(sourceName, outName, clip, platform, format, compression, fit, customCrop);
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
        customCrop={customCrop}
        onCustomCropChange={setCustomCrop}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <FormatSelector value={format} disabled={disabled} onChange={setFormat} />
        <CompressionSelector value={compression} disabled={disabled} onChange={setCompression} />
      </div>
      <TranscriptionSection file={file} disabled={disabled} />
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
