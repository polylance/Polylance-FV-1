# PolyLance Media & Video System Guide

This guide describes how to manage, encode, and add videos to PolyLance without requiring frontend code changes.

---

## 1. How to Add or Replace a Video

1. **Encode your video** using the prescribed specifications (see below).
2. **Drop your video files** into the relevant folder:
   - `frontend/public/media/hero/`
   - `frontend/public/media/tasks/`
   - `frontend/public/media/categories/`
   - `frontend/public/media/stories/`
   - `frontend/public/media/social/`
3. **Drop your poster and captions** into:
   - `frontend/public/media/posters/<id>.webp` (or `.svg` fallback)
   - `frontend/public/media/captions/<id>.en.vtt`
4. **Edit `frontend/public/media/manifest.json`**:
   - Update `sources`:
     ```json
     "sources": {
       "webm": "/media/tasks/task-connect-wallet.webm",
       "mp4": "/media/tasks/task-connect-wallet.mp4"
     }
     ```
   - Change `"status"` from `"coming-soon"` to `"ready"`.
   - Update `transcript` with the full verbatim spoken/on-screen text.
   - Save the manifest. **No frontend code edits or rebuilds required!**

---

## 2. Naming Rules & File Specifications

- **Aspect Ratio**:
  - Landscape videos: `16:9` (1920x1080 or 1600x900)
  - Social / vertical cuts: `9:16` (1080x1920)
- **Framerate**: `30fps` progressive
- **Video Codecs**:
  - H.264 MP4 (`.mp4`) for universal Safari & iOS playback
  - VP9 WebM (`.webm`) for high-compression modern browser playback
- **Audio Codec**: AAC stereo, 128 kbps (or muted / `-an` for ambient videos)
- **Size Limits**:
  - Hero ambient loop: `<= 8 MB` (strictly no audio track)
  - Walkthrough (60-90s): `<= 25 MB`
  - Task & tutorial videos (20-45s): `<= 6 MB` each
  - Posters: WebP or SVG, `<= 200 KB`, 1600px wide
  - Captions: WebVTT (`.vtt`), UTF-8 encoded
- **Content Rules**:
  - Use demo data or test accounts only.
  - Never display real private keys, seed phrases, personal balances, or live production addresses.

---

## 3. Recommended FFmpeg Commands

### Ambient Video (Muted, No Audio Track, Faststart)
```bash
ffmpeg -i in.mov -c:v libx264 -crf 23 -preset slow -movflags +faststart -an out.mp4
ffmpeg -i in.mov -c:v libvpx-vp9 -crf 33 -b:v 0 -an out.webm
```

### Standard Video with Audio (AAC 128k)
```bash
ffmpeg -i in.mov -c:v libx264 -crf 23 -preset slow -movflags +faststart -c:a aac -b:a 128k out.mp4
ffmpeg -i in.mov -c:v libvpx-vp9 -crf 33 -b:v 0 -c:a libopus -b:a 96k out.webm
```

### Extract Poster at 1 Second (1600px wide WebP)
```bash
ffmpeg -i out.mp4 -ss 00:00:01 -frames:v 1 -vf scale=1600:-2 poster.webp
```

---

## 4. Manifest Schema Reference

Each entry in `frontend/public/media/manifest.json` conforms to:
```typescript
interface VideoManifestEntry {
  id: string; // Unique identifier (e.g. "hero-loop", "task-post-job")
  title: string; // Human-readable title
  summary: string; // One sentence description
  type: 'ambient' | 'standard' | 'component';
  aspect: '16:9' | '9:16';
  durationSeconds: number; // Approximate runtime in seconds
  sources: {
    webm?: string;
    mp4?: string;
  };
  poster: string; // Path to poster image
  captions: Array<{
    lang: string; // e.g. "en", "hi", "te"
    label: string; // e.g. "English"
    src: string; // Path to .vtt file
  }>;
  transcript: string; // Full transcript text
  status: 'ready' | 'coming-soon';
  tags: string[];
  isSample: boolean;
  embed?: string; // Optional YouTube nocookie or Vimeo URL
}
```
