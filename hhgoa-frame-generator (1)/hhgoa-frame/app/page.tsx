"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  canvasToBlob,
  cropToCanvas,
  loadImage,
  renderPoster,
  renderIdCard,
  POSTER_PHOTO_AREA,
  type IdCardFields,
} from "@/lib/canvasDraw";
import { generateBuilderTitle } from "@/lib/builderTitle";

type Format = "frame" | "card";
type Step = "upload" | "crop" | "result";

const POSTER_ASPECT = POSTER_PHOTO_AREA.width / POSTER_PHOTO_AREA.height;

const CAPTION_FRAME =
  "Locked in for Hacker House Goa 2026 🌊 built in Goa, for builders — 28–31 Oct. #FrameInGoa";
const CAPTION_CARD =
  "My builder ID for Hacker House Goa 2026 is ready 🏖️ 28–31 Oct, Goa. #FrameInGoa";

async function fileToImageSrc(file: File): Promise<string> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);

  if (!isHeic) {
    return URL.createObjectURL(file);
  }

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return URL.createObjectURL(blob as Blob);
}

export default function Home() {
  const [format, setFormat] = useState<Format>("frame");
  const [step, setStep] = useState<Step>("upload");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [titleSeed, setTitleSeed] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const builderTitle = useMemo(
    () => generateBuilderTitle(name || "Builder", role || "builder", titleSeed),
    [name, role, titleSeed]
  );

  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setLoadError(null);
    setShareLink(null);
    setShareError(null);
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      setLoadError("That doesn't look like an image. Try a JPG, PNG, or HEIC photo.");
      return;
    }
    try {
      setConverting(true);
      const src = await fileToImageSrc(file);
      setImageSrc(src);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setStep("crop");
    } catch {
      setLoadError("Couldn't read that photo. Try a different file.");
    } finally {
      setConverting(false);
    }
  }, []);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const generate = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setGenerating(true);
    setShareLink(null);
    setShareError(null);
    try {
      await document.fonts.ready;
      const img = await loadImage(imageSrc);
      const photoCanvas =
        format === "frame"
          ? cropToCanvas(
              img,
              croppedAreaPixels,
              POSTER_PHOTO_AREA.width,
              POSTER_PHOTO_AREA.height
            )
          : cropToCanvas(img, croppedAreaPixels, 900, 900);

      const finalCanvas =
        format === "frame"
          ? renderPoster(photoCanvas)
          : renderIdCard(photoCanvas, {
              name: name || "Builder",
              role,
              builderTitle,
            } as IdCardFields);

      resultCanvasRef.current = finalCanvas;
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const blob = await canvasToBlob(finalCanvas);
      setResultUrl(URL.createObjectURL(blob));
      setStep("result");
    } catch {
      setLoadError("Something went wrong generating the graphic. Try again.");
    } finally {
      setGenerating(false);
    }
  }, [imageSrc, croppedAreaPixels, format, name, role, builderTitle, resultUrl]);

  const download = useCallback(async () => {
    if (!resultCanvasRef.current) return;
    const blob = await canvasToBlob(resultCanvasRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "frame" ? "hhgoa-2026-poster.png" : "hhgoa-2026-id-card.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [format]);

  const shareToX = useCallback(async () => {
    if (!resultCanvasRef.current) return;
    setSharing(true);
    setShareError(null);
    try {
      const blob = await canvasToBlob(resultCanvasRef.current);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const shareUrl = new URL("/s", window.location.origin);
      shareUrl.searchParams.set("img", data.url);
      if (name) shareUrl.searchParams.set("name", name);
      shareUrl.searchParams.set("kind", format === "card" ? "card" : "frame");
      setShareLink(shareUrl.toString());

      const caption = format === "frame" ? CAPTION_FRAME : CAPTION_CARD;
      const tweetUrl = new URL("https://twitter.com/intent/tweet");
      tweetUrl.searchParams.set("text", caption);
      tweetUrl.searchParams.set("url", shareUrl.toString());
      window.open(tweetUrl.toString(), "_blank", "noopener,noreferrer");
    } catch (err) {
      setShareError(
        err instanceof Error
          ? err.message
          : "Couldn't upload your graphic for sharing. You can still download it and attach it manually."
      );
    } finally {
      setSharing(false);
    }
  }, [format, name]);

  const reset = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setImageSrc(null);
    setResultUrl(null);
    resultCanvasRef.current = null;
    setStep("upload");
    setShareLink(null);
    setShareError(null);
  }, [imageSrc, resultUrl]);

  return (
    <main className="min-h-screen pb-24">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between max-w-3xl mx-auto">
        <div>
          <p className="eyebrow text-xs" style={{ color: "var(--hh-gold)" }}>
            2:47 PM Studio
          </p>
          <h1 className="hh-display text-2xl md:text-3xl font-bold" style={{ color: "var(--hh-cream)" }}>
            Frame / ID Generator
          </h1>
        </div>
        <a href="https://hhgoa.com" className="eyebrow text-xs hidden sm:block" style={{ color: "var(--hh-cream)" }}>
          hhgoa.com ↗
        </a>
      </header>

      <div className="hh-checker max-w-3xl mx-auto" />

      <section className="max-w-3xl mx-auto px-6 pt-8">
        <p className="eyebrow text-xs mb-2" style={{ color: "var(--hh-pink)" }}>
          Goa, India · 28–31 Oct 2026
        </p>
        <p className="mb-8 max-w-xl" style={{ color: "var(--hh-cream)" }}>
          Upload a photo, get a branded HH Goa 2026 graphic in seconds. No login, no waiting.
        </p>

        {/* Format toggle */}
        <div className="flex gap-3 mb-8">
          {(
            [
              ["frame", "Event Poster"],
              ["card", "Builder ID Card"],
            ] as [Format, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                setFormat(value);
                if (step === "result") setStep(imageSrc ? "crop" : "upload");
              }}
              data-active={format === value}
              className="hh-chip px-4 py-2 text-xs rounded-sm hh-rise"
            >
              {label}
            </button>
          ))}
        </div>

        {loadError && (
          <p className="mb-4 text-sm" style={{ color: "var(--hh-pink)" }}>
            {loadError}
          </p>
        )}

        {/* STEP: upload */}
        {step === "upload" && (
          <div className="hh-card hh-rise rounded-md p-10 flex flex-col items-center gap-4 text-center">
            <p className="eyebrow text-xs" style={{ color: "var(--hh-gold)" }}>
              Step 1
            </p>
            <p style={{ color: "var(--hh-cream)" }}>
              Upload a photo — portrait, landscape, whatever. JPG, PNG, or HEIC.
            </p>
            <label className="hh-btn px-6 py-3 text-sm font-semibold rounded-sm cursor-pointer">
              {converting ? "Reading photo…" : "Choose photo"}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                capture="environment"
                className="hidden"
                disabled={converting}
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}

        {/* STEP: crop */}
        {step === "crop" && imageSrc && (
          <div className="hh-rise">
            <p className="eyebrow text-xs mb-3" style={{ color: "var(--hh-gold)" }}>
              Step 2 — position your photo
            </p>
            <div
              className="relative w-full rounded-md overflow-hidden hh-card"
              style={{ aspectRatio: format === "frame" ? POSTER_ASPECT : 1 }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={format === "frame" ? POSTER_ASPECT : 1}
                cropShape={format === "frame" ? "rect" : "round"}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="eyebrow text-xs" style={{ color: "var(--hh-cream)" }}>
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>

            {format === "card" && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="eyebrow text-xs block mb-1" style={{ color: "var(--hh-gold)" }}>
                    Name
                  </label>
                  <input
                    className="hh-input w-full px-3 py-2 rounded-sm"
                    placeholder="Your name"
                    value={name}
                    maxLength={28}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="eyebrow text-xs block mb-1" style={{ color: "var(--hh-gold)" }}>
                    Stack / role
                  </label>
                  <input
                    className="hh-input w-full px-3 py-2 rounded-sm"
                    placeholder="e.g. Full-stack, Design, ML"
                    value={role}
                    maxLength={24}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between hh-input px-3 py-2 rounded-sm">
                  <span className="text-sm italic" style={{ color: "var(--hh-cream)" }}>
                    “{builderTitle}”
                  </span>
                  <button
                    type="button"
                    onClick={() => setTitleSeed((s) => s + 1)}
                    className="eyebrow text-xs shrink-0 ml-3"
                    style={{ color: "var(--hh-pink)" }}
                  >
                    Reroll title
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={reset} className="hh-btn-outline px-5 py-3 text-sm rounded-sm">
                Change photo
              </button>
              <button
                onClick={generate}
                disabled={!croppedAreaPixels || generating}
                className="hh-btn px-6 py-3 text-sm font-semibold rounded-sm"
              >
                {generating ? "Generating…" : "Generate graphic"}
              </button>
            </div>
          </div>
        )}

        {/* STEP: result */}
        {step === "result" && resultUrl && (
          <div className="hh-rise">
            <p className="eyebrow text-xs mb-3" style={{ color: "var(--hh-gold)" }}>
              Step 3 — download & share
            </p>
            <div className="hh-card rounded-md p-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="Generated HH Goa graphic"
                className="max-w-full rounded-sm"
                style={{ maxHeight: "70vh" }}
              />
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={download} className="hh-btn px-6 py-3 text-sm font-semibold rounded-sm">
                Download PNG
              </button>
              <button
                onClick={shareToX}
                disabled={sharing}
                className="hh-btn px-6 py-3 text-sm font-semibold rounded-sm"
              >
                {sharing ? "Preparing share…" : "Share to X"}
              </button>
              <button onClick={() => setStep("crop")} className="hh-btn-outline px-5 py-3 text-sm rounded-sm">
                Adjust
              </button>
              <button onClick={reset} className="hh-btn-outline px-5 py-3 text-sm rounded-sm">
                Start over
              </button>
            </div>

            {shareLink && (
              <p className="mt-3 text-xs" style={{ color: "var(--hh-cream)" }}>
                Share link (with live preview):{" "}
                <a href={shareLink} className="underline" style={{ color: "var(--hh-gold)" }}>
                  {shareLink}
                </a>
              </p>
            )}
            {shareError && (
              <p className="mt-3 text-xs" style={{ color: "var(--hh-pink)" }}>
                {shareError}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
