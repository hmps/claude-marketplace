#!/usr/bin/env bun

/**
 * transcribe-vaam-video-with-gemini.ts - Transcribe Vaam videos using Gemini AI
 *
 * A standalone CLI tool for transcribing Vaam videos. Designed for use by coding agents.
 *
 * USAGE:
 *   bun transcribe-vaam-video-with-gemini.ts [OPTIONS] <vaam-url>
 *
 * ARGUMENTS:
 *   <vaam-url>    Vaam share URL (e.g., https://app.vaam.io/share/abc123)
 *
 * OPTIONS:
 *   --help, -h     Show this help message
 *   --verbose, -v  Enable progress logging
 *
 * ENVIRONMENT:
 *   GEMINI_API_KEY  Required. Your Google Gemini API key.
 *
 * EXAMPLES:
 *   bun transcribe-vaam-video-with-gemini.ts https://app.vaam.io/share/abc123
 *   bun transcribe-vaam-video-with-gemini.ts --verbose https://app.vaam.io/share/abc123
 *
 * OUTPUT:
 *   Success: Plain text transcription to stdout
 *   Error:   JSON to stdout: { "success": false, "error": { "code": "...", "message": "...", "details": "...", "suggestion": "..." } }
 *
 * EXIT CODES:
 *   0  Success
 *   1  Usage/validation error (bad input, missing API key)
 *   2  Runtime error (network failure, API error)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { mkdir, unlink, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// =============================================================================
// Types
// =============================================================================

interface ErrorResult {
  success: false;
  error: {
    code: string;
    message: string;
    details: string;
    suggestion: string;
  };
}

type ErrorCode =
  | "MISSING_ARGUMENT"
  | "INVALID_URL"
  | "MISSING_API_KEY"
  | "VIDEO_EXTRACTION_FAILED"
  | "VIDEO_DOWNLOAD_FAILED"
  | "TRANSCRIPTION_FAILED";

// =============================================================================
// Configuration
// =============================================================================

const VAAM_API_KEY = "e77d68f7-8318-4b48-b7f4-258c9596685f";
const VAAM_URL_PATTERN = /^https:\/\/app\.vaam\.io\/share\/([\w-]+)$/;
const TEMP_DIR = join(tmpdir(), "gemini-analyze-video");
const GEMINI_MODEL = "gemini-2.5-flash";

// =============================================================================
// Globals
// =============================================================================

let verbose = false;
let tempFilePath: string | null = null;

// =============================================================================
// Utilities
// =============================================================================

function log(message: string): void {
  if (verbose) {
    console.log(message);
  }
}

function createError(
  code: ErrorCode,
  message: string,
  details: string,
  suggestion: string
): ErrorResult {
  return {
    success: false,
    error: { code, message, details, suggestion },
  };
}

function outputError(error: ErrorResult): void {
  console.log(JSON.stringify(error, null, 2));
}

function getExitCode(code: ErrorCode): number {
  switch (code) {
    case "MISSING_ARGUMENT":
    case "INVALID_URL":
    case "MISSING_API_KEY":
      return 1;
    case "VIDEO_EXTRACTION_FAILED":
    case "VIDEO_DOWNLOAD_FAILED":
    case "TRANSCRIPTION_FAILED":
      return 2;
  }
}

function showHelp(): void {
  const help = `transcribe-vaam-video-with-gemini.ts - Transcribe Vaam videos using Gemini AI

USAGE:
  bun transcribe-vaam-video-with-gemini.ts [OPTIONS] <vaam-url>

ARGUMENTS:
  <vaam-url>    Vaam share URL (e.g., https://app.vaam.io/share/abc123)

OPTIONS:
  --help, -h     Show this help message
  --verbose, -v  Enable progress logging

ENVIRONMENT:
  GEMINI_API_KEY  Required. Your Google Gemini API key.

EXAMPLES:
  bun transcribe-vaam-video-with-gemini.ts https://app.vaam.io/share/abc123
  bun transcribe-vaam-video-with-gemini.ts --verbose https://app.vaam.io/share/abc123

OUTPUT:
  Success: Plain text transcription to stdout
  Error:   JSON to stdout: { "success": false, "error": { "code": "...", "message": "...", "details": "...", "suggestion": "..." } }

EXIT CODES:
  0  Success
  1  Usage/validation error (bad input, missing API key)
  2  Runtime error (network failure, API error)`;

  console.log(help);
}

// =============================================================================
// Cleanup
// =============================================================================

async function cleanup(): Promise<void> {
  if (tempFilePath) {
    try {
      await unlink(tempFilePath);
      log(`Cleaned up temporary file: ${tempFilePath}`);
    } catch {
      // Ignore cleanup errors - file may not exist
    }
  }
}

// =============================================================================
// Vaam Video Extraction
// =============================================================================

function extractCaptureId(vaamUrl: string): string | null {
  const match = vaamUrl.match(VAAM_URL_PATTERN);
  return match?.[1] ?? null;
}

async function extractVideoUrl(vaamUrl: string): Promise<string | null> {
  const captureId = extractCaptureId(vaamUrl);
  if (!captureId) {
    return null;
  }

  const apiUrl = `https://app.vaam.io/api/captures/paths?captureId=${captureId}&apiKey=${VAAM_API_KEY}`;

  log(`Fetching video URL from Vaam API...`);

  const response = await fetch(apiUrl);
  if (!response.ok) {
    return null;
  }

  const data = await response.json() as { mp4?: string; webm?: string; hls?: string } || undefined;

  if (!data) {
    const error = createError('VIDEO_DOWNLOAD_FAILED', `Failed to extract video URL from Vaam API response`, '', 'Validate the link');
    outputError(error);
    return null;
  }

  // Prefer MP4, fallback to WebM, then HLS
  return data.mp4 || data.webm || data.hls || null;
}

// =============================================================================
// Video Download
// =============================================================================

async function downloadVideo(videoUrl: string): Promise<string> {
  await mkdir(TEMP_DIR, { recursive: true });

  const fileName = `vaam-${Date.now()}.mp4`;
  const filePath = join(TEMP_DIR, fileName);

  log(`Downloading video to ${filePath}...`);

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await Bun.write(filePath, buffer);

  const fileSizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
  log(`Downloaded ${fileSizeMB} MB`);

  return filePath;
}

// =============================================================================
// Gemini Transcription
// =============================================================================

async function transcribeVideo(
  videoPath: string,
  apiKey: string
): Promise<string> {
  log(`Reading video file...`);
  const videoBuffer = await readFile(videoPath);
  const videoBase64 = videoBuffer.toString("base64");

  log(`Sending to Gemini for transcription...`);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Please transcribe this video. If the video is in another language, do not translate it.

Include all spoken content and any important visual information shown on screen.

Do not include timestamps in the transcription.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "video/mp4",
        data: videoBase64,
      },
    },
    prompt,
  ]);

  const transcription = result.response.text();
  log(`Transcription complete (${transcription.length} characters)`);

  return transcription;
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse flags
  const helpFlag = args.includes("--help") || args.includes("-h");
  const verboseFlag = args.includes("--verbose") || args.includes("-v");

  // Filter out flags to get positional arguments
  const positionalArgs = args.filter(
    (arg) => !arg.startsWith("-") && !arg.startsWith("--")
  );

  // Handle help flag
  if (helpFlag) {
    showHelp();
    process.exit(0);
  }

  // Set verbose mode
  verbose = verboseFlag;

  // Validate arguments
  const vaamUrl = positionalArgs[0];
  if (!vaamUrl) {
    const error = createError(
      "MISSING_ARGUMENT",
      "No Vaam URL provided",
      "This command requires a Vaam share URL as an argument.",
      "Run with --help to see usage examples, or provide a URL like: bun transcribe-vaam-video-with-gemini.ts https://app.vaam.io/share/abc123"
    );
    outputError(error);
    process.exit(getExitCode(error.error.code as ErrorCode));
  }

  // Validate URL format
  if (!VAAM_URL_PATTERN.test(vaamUrl)) {
    const error = createError(
      "INVALID_URL",
      "Invalid Vaam URL format",
      `Received: "${vaamUrl}". Expected format: https://app.vaam.io/share/[id]`,
      "Ensure the URL matches the pattern https://app.vaam.io/share/[alphanumeric-id]. The ID can contain letters, numbers, and hyphens."
    );
    outputError(error);
    process.exit(getExitCode(error.error.code as ErrorCode));
  }

  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = createError(
      "MISSING_API_KEY",
      "GEMINI_API_KEY environment variable not set",
      "The Gemini API key is required to transcribe videos.",
      "Set the GEMINI_API_KEY environment variable. You can get an API key from https://aistudio.google.com/apikey"
    );
    outputError(error);
    process.exit(getExitCode(error.error.code as ErrorCode));
  }

  log(`Processing Vaam URL: ${vaamUrl}`);

  try {
    // Extract video URL from Vaam
    const videoUrl = await extractVideoUrl(vaamUrl);
    if (!videoUrl) {
      const error = createError(
        "VIDEO_EXTRACTION_FAILED",
        "Could not extract video URL from Vaam",
        `The Vaam API did not return a video URL for: ${vaamUrl}`,
        "Verify the Vaam link is valid and the video exists. The video may have been deleted or the link may have expired."
      );
      outputError(error);
      process.exit(getExitCode(error.error.code as ErrorCode));
    }

    log(`Video URL: ${videoUrl}`);

    // Download video
    try {
      tempFilePath = await downloadVideo(videoUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const error = createError(
        "VIDEO_DOWNLOAD_FAILED",
        "Failed to download video file",
        `Download error: ${errorMessage}`,
        "Check your network connection. The video URL may have expired or the server may be temporarily unavailable."
      );
      outputError(error);
      process.exit(getExitCode(error.error.code as ErrorCode));
    }

    // Transcribe video
    let transcription: string;
    try {
      transcription = await transcribeVideo(tempFilePath, apiKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const error = createError(
        "TRANSCRIPTION_FAILED",
        "Gemini API transcription error",
        `Transcription error: ${errorMessage}`,
        "Check your GEMINI_API_KEY is valid. The video may be too large, corrupted, or in an unsupported format. Gemini supports videos up to 2GB."
      );
      outputError(error);
      process.exit(getExitCode(error.error.code as ErrorCode));
    }

    // Success - output plain text transcription
    console.log(transcription);
    process.exit(0);
  } finally {
    await cleanup();
  }
}

// Run main function
main().catch(async (err) => {
  await cleanup();
  const errorMessage = err instanceof Error ? err.message : String(err);
  const error = createError(
    "TRANSCRIPTION_FAILED",
    "Unexpected error",
    `Error: ${errorMessage}`,
    "This is an unexpected error. Check the error details and try again."
  );
  outputError(error);
  process.exit(2);
});
