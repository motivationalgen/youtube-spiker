import { formatBytes, formatTime } from "./helpers";
import type { VideoMetadata } from "./types";

type Props = {
  file: File | null;
  previewUrl: string | null;
  metadata: VideoMetadata | null;
};

export function VideoPreview({ file, previewUrl, metadata }: Props) {
  if (!previewUrl) return null;

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)]">
      <video src={previewUrl} controls playsInline className="aspect-video w-full rounded-lg border bg-muted object-contain" />
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">Ready</span>
          <span className="truncate text-sm font-medium">{file?.name}</span>
        </div>
        {metadata && (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="font-medium">{formatTime(metadata.duration)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Resolution</dt>
              <dd className="font-medium">{metadata.width}×{metadata.height}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">File size</dt>
              <dd className="font-medium">{formatBytes(metadata.size)}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
