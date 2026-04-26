## Problem

After the FFmpeg engine loads successfully, processing fails immediately with:

```
Error: File could not be read! Code=-1
```

This is thrown inside `@ffmpeg/util`'s `fetchFile()` helper. It internally creates a `FileReader` and calls `readAsArrayBuffer(file)`. On some browsers (notably mobile Safari / Chrome on Android, where the user's preview is running at 384×703 with DPR 1.875), `FileReader.onerror` fires with code `-1` when:

- The `File` originates from a previous `URL.createObjectURL()` lifecycle and the underlying blob handle has been touched, or
- The file is large and the single-shot `readAsArrayBuffer` exceeds memory, or
- The browser's FileReader implementation rejects the input for an unrelated reason.

The result is a hard failure at 12% with no recovery.

## Fix

Replace the brittle `fetchFile(file)` call with a direct `file.arrayBuffer()` read (the modern Blob API), which uses streams under the hood and is far more reliable across browsers. Fall back to a chunked `slice().arrayBuffer()` loop if the one-shot read fails. This keeps the rest of the pipeline (ffmpeg.writeFile, ffmpeg.exec, ffmpeg.readFile, blob output) unchanged.

### File: `src/routes/_app.video-tool.tsx`

1. Remove the `fetchFile` import/return from `loadFfmpeg` (no longer needed).
2. Add a new helper `readFileAsUint8Array(file, onProgress)`:
   - Try `await file.arrayBuffer()` first → wrap in `new Uint8Array(buffer)`.
   - On failure, fall back to chunked reading: slice the file in 8 MB chunks, await `arrayBuffer()` per chunk, copy into a single pre-allocated `Uint8Array(file.size)`, and report progress between 12–15%.
   - Log each step with `[video-tool]` prefix so failures stay visible in the console.
3. Replace `await ffmpeg.writeFile(sourceName, await fetchFile(file))` with `await ffmpeg.writeFile(sourceName, await readFileAsUint8Array(file, setProgress))`.
4. Surface a clearer error message when the read still fails: "Could not read the video file from your device. Try re-selecting the file or use a smaller video."

### Why this works

- `Blob.arrayBuffer()` is a Promise-based, stream-backed API supported in all modern browsers (Chrome 76+, Safari 14+, Firefox 69+) and does not hit the FileReader code path that produces `Code=-1`.
- Chunked fallback handles edge cases on memory-constrained mobile browsers without changing the FFmpeg pipeline.
- No other parts of the tool need to change — engine loading, encoding args, output blob handling, and UI all stay the same.

### Verification

After the fix, the console should show:

```
[video-tool] Writing input file input.mp4
[video-tool] Read N bytes from file
[ffmpeg] ...encoding logs...
```

and the progress bar should advance past 15% into the encoding phase instead of stalling at 12%.
