# CaptionFlow

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/status-v1.0-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/tech-Rust%20%2B%20React-orange" alt="Built with Rust and React">
</p>

CaptionFlow is a privacy-first, open-source video caption editor that runs entirely in your browser. It uses a high-performance stack (Rust, Wasm, WebGL) to handle transcription, editing, and video processing directly on your machine—no server uploads required.

<br>

<p align="center">
  <img src="public/captionflow-demo.gif" alt="CaptionFlow Demo" width="800"/>
</p>

### Core Features

*   **AI-Powered Transcription:** Generate accurate subtitles using an in-browser version of Whisper. Your files stay local.
*   **High-Performance Timeline:** A WebGL-rendered timeline provides a fluid UI for precise, frame-by-frame editing, even on longer videos.
*   **Client-Side Video Processing:** Burn styled captions directly into your video file using FFmpeg compiled to WebAssembly.
*   **Standard Export Formats:** Download your work as an `.srt` file for use on any platform.
*   **Session Persistence:** Your work is automatically saved to the browser's IndexedDB, so you can pick up where you left off.

### Live Version

Try the live version at **[captionflow.net](https://captionflow.net)**.

*Note: The AI models are fetched on first use, so the initial transcription may take a moment to start.*

---

### Tech Stack

The core idea is to do as much as possible on the client-side, giving the user full control over their data and enabling a fast, desktop-like experience on the web.

*   **Rust → WebAssembly:** Core editor logic, caption manipulation, and undo/redo history are handled in Rust for performance and safety.
*   **WebGL:** The timeline and audio waveform are rendered via WebGL for a smooth UI that doesn't freeze, even with a lot of data.
*   **FFmpeg.wasm:** For burning subtitles directly into the video file in the browser.
*   **whisper.cpp (Wasm):** For high-quality, in-browser audio transcription.
*   **Frontend:** Built with React, TypeScript, and Vite. Styled with Tailwind CSS.
