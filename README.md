<p align="center">
  <img src="https://raw.githubusercontent.com/PramaAditya/n8n-nodes-buffer/main/nodes/Buffer/buffer.svg" width="80" height="80" alt="n8n Buffer Icon">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/n8n-nodes-buffer"><img src="https://img.shields.io/npm/v/n8n-nodes-buffer?style=flat-square&color=orange" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/n8n-nodes-buffer"><img src="https://img.shields.io/npm/dw/n8n-nodes-buffer?style=flat-square&color=blue" alt="npm downloads"></a>
  <a href="https://github.com/PramaAditya/n8n-nodes-buffer/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/PramaAditya/n8n-nodes-buffer?style=flat-square&color=green" alt="license"></a>
  <img src="https://img.shields.io/badge/n8n-Community_Node-black?style=flat-square" alt="n8n community node">
</p>

# n8n-nodes-buffer

<p align="center">
  <b>Power-publish videos to Buffer directly from n8n.</b>
  <br>
  Download videos via yt-dlp, transcode with production-grade compatibility parameters,
  <br>
  stream to S3, and schedule across multiple Buffer social channels in a single flow.
</p>

---

### Hero Demo

```text
[Workflow execution started]

→ Phase 1: yt-dlp S3 Downloader
   ✓ Input URL: https://www.instagram.com/p/C_reel123/
   ✓ Executing yt-dlp with auto-transcoding parameters:
     - Profile: H.264 Main L4.2 (yuv420p) | Audio: AAC (44.1kHz)
     - Moov-atom: Optimized for web (+faststart)
   ✓ direct upload to S3: s3://social-assets-bucket/posts/reel.mp4
   ✓ Output: https://cdn.mybrand.com/posts/reel.mp4

→ Phase 2: Buffer Uploader
   ✓ Connected to Buffer GraphQL API
   ✓ Selected Org: Prama Workspace (org_9876543)
   ✓ Selected Channel: Instagram Business (MyBrand)
   ✓ Scheduling Mode: Add to Queue (Scheduled)
   ✓ Payload delivered successfully!

[Workflow finished successfully]
```

---

## Why this package?

| Feature | Standard n8n Nodes | n8n-nodes-buffer |
| :--- | :--- | :--- |
| **Media Streaming** | Downloader holds full file in memory | Direct disk stream via AWS SDK (no RAM bloat) |
| **Video Compatibility** | Raw downloads fail on social uploads | Auto-remux with social-optimized H.264 & AAC profiles |
| **Buffer GraphQL Integration**| Manual HTTP API requests | Built-in dynamic organization, service, and channel selectors |
| **Drafting Workflows** | Hard to isolate drafts vs published posts | Dedicated toggle to easily queue posts as draft |

---

## Minimum Viable Knowledge

- ✅ **yt-dlp Dependency**: The machine running your n8n instance MUST have `yt-dlp` and `ffmpeg` installed and globally accessible in the system PATH.
- ✅ **S3 Permissions**: Your AWS IAM credential needs `s3:PutObject` permissions. If using a custom CDN domain, specify the public URL base in the node config.
- ✅ **Buffer Access Token**: Generate a Personal Access Token from `https://buffer.com/developers/api` to authenticate your Buffer node.
- ✅ **Dynamic Selection**: Selecting an Organization dynamically cascades to filter services and channels connected to that specific workspace.

---

## Installation

### For Self-Hosted n8n (Docker/Local)

1. Open your n8n workspace.
2. Go to **Settings** > **Community Nodes**.
3. Click **Install a node**.
4. Enter `n8n-nodes-buffer`.
5. Agree to the terms and click **Install**.

*Ensure that `yt-dlp` and `ffmpeg` binaries are available in your docker container or host path.*

---

## Available Nodes

### 1. Buffer Uploader (`bufferUploader`)
*   **Dynamic Scoping**: Loads organizations, services, and channels dynamically.
*   **Multi-Platform Support**: Bluesky, Threads, Facebook (Post/Story/Reel), Instagram (Post/Story/Reel), LinkedIn, TikTok, YouTube (Shorts), Twitter/X, Mastodon, Pinterest, Start Page, Google Business.
*   **Media Inputs**: Supports both structured UI asset addition and raw JSON asset arrays.
*   **Custom Metadata**: Raw JSON injector for platform-specific custom scheduling objects.

### 2. yt-dlp S3 Downloader (`ytDlpS3`)
*   **URL Downloader**: Downloads videos from Instagram, YouTube, TikTok, Reddit, and more.
*   **Auto-Transcoding**: Pre-configured FFmpeg commands enforce ideal social upload criteria:
    ```bash
    ffmpeg -profile:v main -level:v 4.2 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -ar 44100 -movflags +faststart
    ```
*   **Chunked Uploads**: Seamless S3 uploading via multi-part streaming helper.

---

## Project Structure

```text
n8n-nodes-buffer/
├── credentials/
│   └── BufferApi.credentials.ts      # GraphQL authentication handler
└── nodes/
    ├── Buffer/
    │   ├── BufferUploader.node.ts    # Main Buffer scheduler
    │   └── GenericFunctions.ts       # Buffer API network helpers
    └── YtDlpS3/
        └── YtDlpS3.node.ts           # yt-dlp & S3 uploader node
```

---

<p align="center">
  <a href="https://github.com/PramaAditya/n8n-nodes-buffer">Repository</a> · <a href="https://buffer.com/developers/api">Buffer API Docs</a>
</p>

<p align="center">
  <sub>License: MIT · Author: Prama Aditya</sub>
</p>
