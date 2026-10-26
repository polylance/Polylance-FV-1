# PolyLance Media & Video Cache Guidelines

## Recommended HTTP Response Headers

All video assets (`.mp4`, `.webm`, `.vtt`) and poster images (`.webp`, `.avif`, `.svg`) served from the `/media` and `/videos` directories should be delivered with the following HTTP headers:

### Static Hashed Media
For immutable, hashed video and poster assets:
```http
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
```

### HTTP Range Requests (Critical for Video Streaming)
All media endpoints must support HTTP 206 Partial Content range requests (`Accept-Ranges: bytes`) to allow efficient video seeks and non-blocking decoding without buffering entire files in memory.
```http
Accept-Ranges: bytes
```

### Manifest File
The `manifest.json` file is dynamic and should use short-lived validation cache:
```http
Cache-Control: public, max-age=300, must-revalidate
```

## Encoding Ladder & Budgets
- **Hero Loop**: Desktop $\le$ 3 MB, Mobile $\le$ 1.2 MB (24fps, no audio, WebM VP9 first then MP4 H.264).
- **Section & Tab Loops**: Desktop $\le$ 1.5 MB, Mobile $\le$ 700 KB.
- **Posters**: WebP or AVIF with intrinsic width & height attributes to guarantee zero layout shift (CLS = 0).
