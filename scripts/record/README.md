# Playwright Demo Recording Automation (Planned Pipeline)

This directory is reserved for the automated Playwright screen recording workflow planned for PolyLance demo mode.

## Planned Capabilities
1. **Scripted Demo Flows**:
   - Launches Chromium in headless or headed mode at 1920x1080 @ 30fps.
   - Uses PolyLance in Demo Mode (`/#/demo` with `DemoProvider` fixture data).
   - Simulates wallet connection, milestone funding, escrow timeline transitions, and SBT certificate minting with repeatable timings.
2. **Deterministic Screen Capture**:
   - Captures webm/mp4 video streams directly via browser context tracing/recordVideo.
   - Strips system mouse cursors or adds crisp vector cursor overlays.
   - Automatically clips and exports exact duration clips into `frontend/public/media/`.

## Prerequisites (Do Not Install Yet)
- `@playwright/test`
- `ffmpeg` on system PATH

When demo mode is implemented, recording scripts will reside here.
