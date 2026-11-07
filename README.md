# Man Stuck in Washing Machine — real-time 3D

A three.js recreation of the short, rendered live on your own GPU in the browser.

- **▶ Start Animation** — plays the scene live, synced to the original audio (clock = `AudioContext.currentTime`).
- **⏺ Render & Download** — deterministic offline render (frame f at t = f/30 s, 720×1280, 30 fps), encoded with WebCodecs (H.264, VP9 fallback) and muxed with the original audio (AAC or Opus) into an MP4 via mp4-muxer. Falls back to MediaRecorder on browsers without WebCodecs. Add `?frames=N` to render only the first N frames.

Characters, set, props, fluids and captions are all procedural code (no external 3D models).
`src/` holds the TypeScript source; `app.js` is the esbuild bundle (three.js r169 MIT, mp4-muxer MIT, Montserrat OFL).
The soundtrack is the original video's audio, included unchanged.
