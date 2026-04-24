# Add All-in-One Video Tool

## Goal
Build a new responsive tool page for trimming, resizing, format conversion, compression, and exporting videos, integrated with the existing YouTube Growth Suite layout and design system.

## Important Scope Note
The page will use browser-side FFmpeg WebAssembly, lazy-loaded only when the user processes a video. This avoids adding server-heavy video processing and keeps the UI fast on initial load. Very large videos will be handled with clear limits and user-friendly errors because browser-based processing depends on device memory and performance.

## 1. New Route and Navigation
Create a new app route:
- `src/routes/_app.video-tool.tsx` for `/video-tool`

Update navigation:
- Add “Video Tool” to the sidebar under Content Tools or a new “Video Tools” section
- Add the tool card to the dashboard/home quick access grid
- Add route metadata:
  - Title: `Free Online Video Trimmer, Resizer & Converter`
  - Meta description for SEO

## 2. Modular Video Tool Components
Create reusable components under `src/components/video-tool/`:
- `VideoUploadSection` — drag/drop upload, file picker, validation, preview player, metadata display
- `TrimTimeline` — scrollable timeline UI with start/end range controls and selected duration display
- `AutoTrimSection` — segment length input and clip preview list
- `PlatformSelector` — clickable cards for platform aspect ratios/resolutions
- `FormatSelector` — radio buttons for MP4, MOV, WEBM, GIF
- `CompressionSelector` — High Quality, Balanced, Small Size options
- `ProcessingPanel` — process button, disabled states, progress bar, errors
- `DownloadPanel` — single download button or multiple clip download list + ZIP download

## 3. Upload and Preview
Support uploads for:
- MP4, MOV, AVI, MKV, WEBM

Behavior:
- Validate file type and size before processing
- Show preview video player after upload
- Read and display:
  - Duration
  - Resolution
  - File size
- Show clear error messages for unsupported formats, unreadable metadata, and oversized files

## 4. Trim and Auto Trim
Manual trim:
- Use a scrollable timeline panel
- Add start/end handles via existing slider UI
- Show selected start, end, and duration in real time
- Allow horizontal scrolling for longer videos

Auto trim:
- User enters segment length in minutes/seconds
- App calculates equal clip ranges automatically
- Handle short videos by showing a validation message if segment length exceeds duration
- Show generated clip list before processing

## 5. Platform Resizing and Crop Preview
Add clickable platform cards:
- YouTube: 16:9, 1920x1080
- TikTok: 9:16, 1080x1920
- Instagram Reel: 9:16, 1080x1920
- Instagram Post: 1:1, 1080x1080
- Facebook: 16:9, 1920x1080
- Twitter/X: 16:9, 1280x720

When selected:
- Highlight the active platform card
- Store selected aspect ratio/resolution
- Show a simple responsive crop preview overlay matching the selected ratio

## 6. Format and Compression Options
Format converter:
- Use existing radio group UI
- Options: MP4 default, MOV, WEBM, GIF

Compression:
- Use selectable cards or segmented buttons
- Options:
  - High Quality
  - Balanced
  - Small Size
- Apply corresponding FFmpeg presets/CRF values where supported

## 7. Processing Engine
Add dependencies needed for browser-side processing:
- `@ffmpeg/ffmpeg`
- `@ffmpeg/util`
- A ZIP library such as `fflate` for “Download All as ZIP”

Processing behavior:
- Lazy-load FFmpeg only after clicking Process
- Keep UI responsive with progress updates
- Use FFmpeg commands for:
  - Trimming
  - Auto-splitting into multiple clips
  - Scaling/padding or cropping to target platform size
  - Format conversion
  - Compression presets
- Display progress percentage using the existing Progress component
- Disable controls while processing

## 8. Export and Download
Single output:
- Show a “Download Video” button
- Use a generated object URL and a clear file name

Multiple auto-trim outputs:
- Show list of generated clips
- Allow downloading each clip individually
- Add “Download All as ZIP” using browser-side ZIP generation
- Revoke object URLs when files are replaced or page unmounts

## 9. Accessibility and UX Extras
- Add tooltip text for each major feature
- Add speaker/read-label buttons using the browser SpeechSynthesis API for key section labels
- Use semantic section headings
- Ensure keyboard-accessible upload, radio buttons, platform cards, and action buttons
- Add smooth transitions and clear disabled/empty states
- Fully responsive layout for mobile, tablet, and desktop

## 10. Edge Cases
Handle:
- No video uploaded
- Unsupported file type
- Very large files / browser memory limits
- Video metadata load failure
- Start time after end time
- Auto trim segment longer than video
- GIF format warning for long/high-resolution videos
- Processing failure with a clear recovery message

## Technical Notes
- No database changes are required.
- No backend API is required for the first implementation.
- The tool will not download videos from YouTube or any external platform; it only processes files uploaded by the user.
- The implementation will follow TanStack Start routing conventions and reuse existing Card, Button, Input, Slider, RadioGroup, Tooltip, Progress, and Label components.