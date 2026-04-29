import type { VideoMetadata } from "./types";
import { acceptedVideoTypes, MAX_VIDEO_SIZE } from "./helpers";

export type VideoPreviewResult = {
  file: File;
  previewUrl: string;
  metadata: VideoMetadata;
  bytes: Uint8Array;
};

const VIDEO_EXTENSION_REGEX = /\.(mp4|mov|avi|mkv|webm)$/i;

export function validateVideoFile(file: File): string | null {
  const validExtension = VIDEO_EXTENSION_REGEX.test(file.name);
  if (!acceptedVideoTypes.includes(file.type) && !validExtension) {
    return "Unsupported format. Upload MP4, MOV, AVI, MKV, or WEBM.";
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return "This file is very large. Please use a video under 700 MB for browser processing.";
  }

  return null;
}

export async function createVideoPreview(file: File): Promise<VideoPreviewResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const stableBlob = new Blob([bytes.slice().buffer as ArrayBuffer], {
    type: file.type || "video/mp4",
  });
  const stableFile = new File([stableBlob], file.name, {
    type: file.type || "video/mp4",
    lastModified: file.lastModified,
  });

  const url = URL.createObjectURL(stableBlob);
  const video = document.createElement("video");
  video.preload = "metadata";

  return new Promise<VideoPreviewResult>((resolve, reject) => {
    video.onloadedmetadata = () => {
      resolve({
        file: stableFile,
        previewUrl: url,
        metadata: {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: stableFile.size,
        },
        bytes,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the video metadata. Try another file."));
    };

    video.src = url;
  });
}
