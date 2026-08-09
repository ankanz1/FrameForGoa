import React, { useState, useEffect, useRef } from 'react';
import { Download, Share2, Sparkles, Check, Twitter, Copy, RefreshCw, ArrowLeft, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mode, BadgeDetails, CropArea } from './types';
import { drawCanvas, canvasToBlob } from './lib/canvasDraw';
import { PhotoCropper } from './components/PhotoCropper';
import { BadgeForm } from './components/BadgeForm';
import { PresetAvatars } from './components/PresetAvatars';
import { getRandomBuilderTitle } from './lib/builderTitle';

export default function App() {
  const [mode, setMode] = useState<Mode>('pfp');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);

  const [badgeDetails, setBadgeDetails] = useState<BadgeDetails>({
    name: 'Ankan Mukherjee',
    handle: '@ankan_m',
    role: 'Full-Stack Hacker',
    title: 'Autonomous Wizard of Goa',
    track: 'AI & Agents',
    company: 'HH Goa 2026',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [renderedDataUrl, setRenderedDataUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const openStudio = (targetMode: Mode) => {
    setMode(targetMode);
    setIsStudioOpen(true);
    setTimeout(() => {
      const el = document.getElementById('generator-studio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Trigger canvas re-draw whenever inputs change
  useEffect(() => {
    let active = true;

    async function updatePreview() {
      setIsGenerating(true);
      try {
        const canvas = await drawCanvas(mode, imageSrc, cropArea, badgeDetails);
        if (!active) return;

        previewCanvasRef.current = canvas;
        const dataUrl = canvas.toDataURL('image/png');
        setRenderedDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to draw canvas', err);
      } finally {
        if (active) setIsGenerating(false);
      }
    }

    updatePreview();

    return () => {
      active = false;
    };
  }, [mode, imageSrc, cropArea, badgeDetails]);

  // Download high-resolution PNG via canvas.toBlob → real file download
  const handleDownload = async () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // Trigger celebratory confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f6c81a', '#ff2e93', '#ffffff'],
    });

    try {
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const filename =
        mode === 'pfp'
          ? 'hh-goa-2026-pfp-frame.png'
          : `hh-goa-2026-builder-badge-${(badgeDetails.name || 'builder')
              .toLowerCase()
              .replace(/\s+/g, '-')}.png`;

      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PNG', err);
    }
  };

  // Upload graphic & prepare share intent on X
  const handleShareToX = async () => {
    if (!renderedDataUrl) return;
    setIsSharing(true);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: renderedDataUrl }),
      });

      const data = await res.json();
      if (data.url) {
        setShareUrl(data.url);

        // Pre-fill tweet caption with #FrameInGoa hashtag & share URL
        const tweetText = encodeURIComponent(
          `I just created my official HH Goa 2026 ${
            mode === 'pfp' ? 'PFP Frame' : 'Builder Badge'
          }! 🌴🔥\n\nCheck it out & create yours:\n${data.url}\n\n#FrameInGoa #HHGoa2026 @HHGoa2026`
        );

        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
      }
    } catch (err) {
      console.error('Share upload failed', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[var(--hh-green)] text-[var(--hh-cream)] font-body-text pb-16 relative overflow-x-hidden">
      <div className="relative z-10">
        {/* Official HH Goa Hero Banner Section (Full Screen Opening View) */}
        <section
          className="bg-[var(--hh-green)] bg-cover bg-center px-4 py-8 sm:py-12 min-h-screen flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundImage: "linear-gradient(rgba(11, 104, 57, 0.38), rgba(11, 104, 57, 0.38)), url('/goa-beach-illustration.svg')" }}
        >
          <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col justify-between min-h-screen py-4">
            {/* Integrated Top Bar inside Hero */}
            <div className="flex items-center justify-between">
              {/* Hacker House Goa Logo (Left) */}
              <a href="https://hhgoa.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                <img
                  src="/hh-goa-logo.svg"
                  alt="Hacker House Goa"
                  className="h-10 sm:h-12 w-auto object-contain transition transform group-hover:scale-105"
                />
              </a>

              {/* 2:47 PM Studio Logo (Right) */}
              <a
                href="https://hhgoa.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 group hover:opacity-90 transition"
              >
                <img
                  src="/studio-logo.svg"
                  alt="2:47 PM Studio"
                  className="h-9 sm:h-11 w-auto object-contain transition transform group-hover:scale-105"
                />
              </a>
            </div>

            {/* Center Giant Hero Title with Overlaid Devanagari Goa */}
            <div className="relative text-center my-auto py-8">
              {/* Main "HACKER HOUSE" Display Image */}
              <div className="flex items-center justify-center">
                <img
                  src="/hacker-house-title.svg"
                  alt="HACKER HOUSE"
                  className="w-full max-w-4xl h-auto mx-auto select-none drop-shadow-xl"
                />
              </div>

              {/* Pink Devanagari "गोवा" Badge Overlaid in Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transform hover:scale-110 transition duration-300">
                <div className="bg-[var(--hh-pink)] text-[var(--hh-gold)] font-black text-3xl sm:text-5xl md:text-6xl px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-3xl border-4 border-[var(--hh-gold)] shadow-2xl rotate-[-6deg] flex items-center justify-center tracking-wider">
                  गोवा
                </div>
              </div>
            </div>


          </div>
        </section>

        {/* Main App Content Area (Full Page Section) */}
        <main id="main-section" className="max-w-6xl mx-auto px-4 min-h-screen flex flex-col justify-center py-12">
          {/* Interactive Floating TRY Notice Board */}
          <section className="text-center my-auto">
            <div className="inline-block mb-4">
              <span className="font-mono text-xs font-bold tracking-[0.3em] text-[var(--hh-gold)] uppercase">
                TRY
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-[var(--hh-cream)] tracking-tight uppercase leading-none mt-1">
                FrameInGoa
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-2 text-left">
              {/* Card 1: Circular PFP Frame */}
              <div
                onClick={() => openStudio('pfp')}
                className={`group relative bg-[var(--hh-cream)] text-[var(--hh-ink)] p-4 sm:p-5 rounded-xl shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                  isStudioOpen && mode === 'pfp'
                    ? 'border-[var(--hh-pink)] ring-4 ring-[var(--hh-pink)]/30'
                    : 'border-[#e2e8f0] hover:border-[var(--hh-gold)]'
                }`}
              >
                {/* Fixed Push Pin Anchor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-[var(--hh-pink)] via-[var(--hh-pink)] to-[var(--hh-pink)] border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/90 shadow-inner" />
                  <div className="absolute top-0.5 left-1 w-1 h-1 rounded-full bg-white/60" />
                </div>

                {/* Active Badge */}
                {isStudioOpen && mode === 'pfp' && (
                  <div className="absolute top-2.5 right-2.5 bg-[var(--hh-pink)] text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Active Mode
                  </div>
                )}

                <div className="text-center pt-2 space-y-2">
                  <h4 className="font-mono text-sm sm:text-base font-bold leading-snug text-[var(--hh-ink)]">
                    HH Goa Frame / ID Card Generator
                  </h4>
                  <p className="font-mono text-[11px] text-[var(--hh-ink-muted)] leading-relaxed">
                    Generate circular PFP frame overlay with Goa sunrise graphics for X & LinkedIn.
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudio('pfp');
                      }}
                      className={`font-serif text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-1.5 mx-auto ${
                        isStudioOpen && mode === 'pfp'
                          ? 'bg-[var(--hh-pink)] text-white shadow-[var(--hh-pink)]/40 scale-105'
                          : 'bg-[var(--hh-gold)] text-[var(--hh-ink)] hover:bg-[var(--hh-pink)] hover:text-white'
                      }`}
                    >
                      <span>{isStudioOpen && mode === 'pfp' ? 'PFP STUDIO ACTIVE' : 'OPEN PFP FRAME STUDIO'}</span>
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono text-[10px] text-[var(--hh-ink-muted)] pt-0.5 uppercase">
                    AUG 6, 2026 • HH GOA
                  </div>
                </div>
              </div>

              {/* Card 2: Builder Badge ID */}
              <div
                onClick={() => openStudio('card')}
                className={`group relative bg-[var(--hh-cream)] text-[var(--hh-ink)] p-4 sm:p-5 rounded-xl shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                  isStudioOpen && mode === 'card'
                    ? 'border-[var(--hh-pink)] ring-4 ring-[var(--hh-pink)]/30'
                    : 'border-[#e2e8f0] hover:border-[var(--hh-gold)]'
                }`}
              >
                {/* Fixed Push Pin Anchor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-[#fde047] via-[var(--hh-gold)] to-[#ca8a04] border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[var(--hh-ink)] opacity-80" />
                  <div className="absolute top-0.5 left-1 w-1 h-1 rounded-full bg-white/70" />
                </div>

                {/* Active Badge */}
                {isStudioOpen && mode === 'card' && (
                  <div className="absolute top-2.5 right-2.5 bg-[var(--hh-pink)] text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Active Mode
                  </div>
                )}

                <div className="text-center pt-2 space-y-2">
                  <h4 className="font-mono text-sm sm:text-base font-bold leading-snug text-[var(--hh-ink)]">
                    HHGoa'26 : Official Builder Pass ID
                  </h4>
                  <p className="font-mono text-[11px] text-[var(--hh-ink-muted)] leading-relaxed">
                    Full 800x1100 portrait ID card badge with custom tracks, handle, and QR code.
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudio('card');
                      }}
                      className={`font-serif text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-1.5 mx-auto ${
                        isStudioOpen && mode === 'card'
                          ? 'bg-[var(--hh-pink)] text-white shadow-[var(--hh-pink)]/40 scale-105'
                          : 'bg-[var(--hh-gold)] text-[var(--hh-ink)] hover:bg-[var(--hh-pink)] hover:text-white'
                      }`}
                    >
                      <span>{isStudioOpen && mode === 'card' ? 'BUILDER ID ACTIVE' : 'OPEN BUILDER ID STUDIO'}</span>
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono text-[10px] text-[var(--hh-ink-muted)] pt-0.5 uppercase">
                    AUG 3, 2026 • HH GOA
                  </div>
                </div>
              </div>
            </div>
          </section>

        {/* Generator Studio Workspace - Only visible when a card button is clicked */}
        {isStudioOpen && (
          <div id="generator-studio" className="mt-8 pt-8 animate-fadeIn">
            {/* Top Navigation Bar inside Studio */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--hh-green)] p-4 rounded-2xl mb-8 shadow-xl">
              <button
                onClick={() => setIsStudioOpen(false)}
                className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--hh-gold)] hover:text-white bg-[var(--hh-green-dark)] px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                ← BACK TO FRAMEINGOA
              </button>

              <div className="flex items-center gap-2 bg-[var(--hh-green-dark)] p-1.5 rounded-xl">
                <button
                  onClick={() => setMode('pfp')}
                  className={`py-2 px-4 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mode === 'pfp'
                      ? 'bg-[var(--hh-gold)] text-[var(--hh-ink)] shadow-md'
                      : 'text-[var(--hh-ink-muted)] hover:text-[var(--hh-cream)]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--hh-ink)]" />
                  1. Circular PFP Frame
                </button>

                <button
                  onClick={() => setMode('card')}
                  className={`py-2 px-4 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mode === 'card'
                      ? 'bg-[var(--hh-pink)] text-white shadow-md'
                      : 'text-[var(--hh-ink-muted)] hover:text-[var(--hh-cream)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  2. Builder Pass ID
                </button>
              </div>

              <button
                onClick={() => setIsStudioOpen(false)}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--hh-ink-muted)] hover:text-[var(--hh-pink)] transition cursor-pointer"
              >
                <X className="w-4 h-4" /> Close Studio
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Customization Controls */}
              <div className="lg:col-span-6 space-y-6">
                <PhotoCropper
                  imageSrc={imageSrc}
                  onImageChange={setImageSrc}
                  onCropChange={setCropArea}
                />

                {!imageSrc && (
                  <PresetAvatars onSelectPreset={(presetUrl) => setImageSrc(presetUrl)} />
                )}

                {mode === 'card' && (
                  <BadgeForm details={badgeDetails} onChange={setBadgeDetails} />
                )}
              </div>

              {/* Right Column: Live Canvas Preview & Action Buttons */}
              <div className="lg:col-span-6 lg:sticky lg:top-24">
                <div className="bg-[var(--hh-green)] rounded-2xl p-6 shadow-xl text-center">
                  <div className="flex items-center justify-between mb-4 text-left">
                    <div>
                      <h3 className="font-playfair text-xl font-bold text-[var(--hh-cream)]">
                        Live Graphic Preview
                      </h3>
                      <p className="text-xs text-[var(--hh-ink-muted)] font-mono">
                        {mode === 'pfp' ? '1080 × 1080 Square Canvas' : '1080 × 1350 Portrait Card'}
                      </p>
                    </div>

                    {isGenerating && (
                      <span className="text-xs font-mono text-[var(--hh-gold)] flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rendering...
                      </span>
                    )}
                  </div>

                  {/* Live Canvas Render Container */}
                  <div className="relative mx-auto max-w-md bg-[var(--hh-green-dark)] rounded-xl overflow-hidden p-2 flex items-center justify-center min-h-[340px]">
                    {renderedDataUrl ? (
                      <img
                        src={renderedDataUrl}
                        alt="Generated HH Goa Graphic"
                        className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-lg"
                      />
                    ) : (
                      <div className="p-8 text-[var(--hh-ink-muted)]">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--hh-gold)] border-t-transparent mb-2" />
                        <p className="text-sm">Generating your frame...</p>
                      </div>
                    )}
                  </div>

                  {/* Main Action Call to Actions */}
                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={handleDownload}
                      disabled={!renderedDataUrl}
                      className="w-full sm:flex-1 bg-[var(--hh-gold)] hover:bg-[color-mix(in_srgb,var(--hh-gold)_80%,var(--hh-ink))] text-[var(--hh-ink)] font-bold py-3.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download PNG
                    </button>

                    <button
                      onClick={handleShareToX}
                      disabled={!renderedDataUrl || isSharing}
                      className="w-full sm:flex-1 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer text-sm"
                    >
                      <Twitter className="w-4 h-4 fill-current" />
                      {isSharing ? 'Uploading...' : 'Share to X (#FrameInGoa)'}
                    </button>
                  </div>

                  {/* Generated Shareable Link Callout */}
                  {shareUrl && (
                    <div className="mt-4 bg-[var(--hh-ink)] border border-[var(--hh-green-dark)] p-3 rounded-xl flex items-center justify-between gap-2 text-left">
                      <div className="overflow-hidden">
                        <span className="block text-[10px] font-mono font-bold text-[var(--hh-gold)]">
                          PUBLIC SHARE PREVIEW LINK:
                        </span>
                        <span className="text-xs text-[var(--hh-ink-muted)] font-mono truncate block">
                          {shareUrl}
                        </span>
                      </div>

                      <button
                        onClick={handleCopyLink}
                        className="bg-[var(--hh-green-dark)] hover:bg-[var(--hh-green-dark)] text-[var(--hh-cream)] p-2 rounded-lg text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
