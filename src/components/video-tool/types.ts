export type VideoMetadata = {
  duration: number;
  width: number;
  height: number;
  size: number;
};

export type PlatformPreset = {
  id: string;
  label: string;
  ratio: string;
  width: number;
  height: number;
  note: string;
};

export type OutputFormat = "mp4" | "mov" | "webm" | "gif";
export type CompressionMode = "high" | "balanced" | "small";

export type ClipRange = {
  id: string;
  label: string;
  start: number;
  end: number;
};

export type ProcessedClip = ClipRange & {
  url: string;
  blob: Blob;
  filename: string;
};
