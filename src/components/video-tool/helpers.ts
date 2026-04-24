import type { ClipRange, CompressionMode, OutputFormat, PlatformPreset } from "./types";

export const MAX_VIDEO_SIZE = 700 * 1024 * 1024;

export const acceptedVideoTypes = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
];

export const platformPresets: PlatformPreset[] = [
  { id: "youtube", label: "YouTube", ratio: "16:9", width: 1920, height: 1080, note: "Landscape video" },
  { id: "tiktok", label: "TikTok", ratio: "9:16", width: 1080, height: 1920, note: "Vertical short" },
  { id: "instagram-reel", label: "Instagram Reel", ratio: "9:16", width: 1080, height: 1920, note: "Vertical reel" },
  { id: "instagram-post", label: "Instagram Post", ratio: "1:1", width: 1080, height: 1080, note: "Square post" },
  { id: "facebook", label: "Facebook", ratio: "16:9", width: 1920, height: 1080, note: "Feed video" },
  { id: "twitter", label: "Twitter/X", ratio: "16:9", width: 1280, height: 720, note: "Timeline video" },
];

export const formatLabels: Record<OutputFormat, string> = {
  mp4: "MP4",
  mov: "MOV",
  webm: "WEBM",
  gif: "GIF",
};

export const compressionLabels: Record<CompressionMode, { label: string; description: string; crf: number }> = {
  high: { label: "High Quality", description: "Best detail, larger file", crf: 18 },
  balanced: { label: "Balanced", description: "Recommended export", crf: 23 },
  small: { label: "Small Size", description: "Faster sharing", crf: 30 },
};

export function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function buildAutoClips(duration: number, segmentLength: number): ClipRange[] {
  if (!duration || !segmentLength || segmentLength <= 0 || segmentLength > duration) return [];
  const clips: ClipRange[] = [];
  let start = 0;
  let index = 1;
  while (start < duration - 0.25) {
    const end = Math.min(start + segmentLength, duration);
    clips.push({ id: `clip-${index}`, label: `Clip ${index}`, start, end });
    start = end;
    index += 1;
  }
  return clips;
}
