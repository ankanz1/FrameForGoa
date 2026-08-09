import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

/**
 * Stores the generated graphic so it has a durable public URL.
 * That URL is what /s (the share landing page) points its
 * og:image meta tag at, which is what makes the X link preview
 * show the actual graphic instead of a blank thumbnail.
 *
 * Requires a BLOB_READ_WRITE_TOKEN env var (Vercel Blob store,
 * see README for setup).
 */
export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Blob storage isn't configured. Set BLOB_READ_WRITE_TOKEN (see README).",
      },
      { status: 500 }
    );
  }

  const contentType = req.headers.get("content-type") || "image/png";
  const arrayBuffer = await req.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    return NextResponse.json({ error: "Empty upload" }, { status: 400 });
  }
  // basic size guard, ~15MB
  if (arrayBuffer.byteLength > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const filename = `hhgoa-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.png`;

  const blob = await put(filename, arrayBuffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });

  return NextResponse.json({ url: blob.url });
}
