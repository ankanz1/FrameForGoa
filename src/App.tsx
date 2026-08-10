import React, { useState, useEffect, useRef } from 'react';
import { Download, Share2, Sparkles, RefreshCw, ArrowLeft, X, Menu } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mode, BadgeDetails, CropArea } from './types';
import { drawCanvas, canvasToBlob } from './lib/canvasDraw';
import { PhotoCropper } from './components/PhotoCropper';
import { BadgeForm } from './components/BadgeForm';
import { PresetAvatars } from './components/PresetAvatars';
import { getRandomBuilderTitle } from './lib/builderTitle';
import { CountdownTimer } from './components/CountdownTimer';
import { MarqueeTicker } from './components/MarqueeTicker';
import { PhysicsCardPreview } from './components/PhysicsCardPreview';

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.964 6.817H1.684l7.73-8.835L1.258 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

// Vercel serverless functions cap request bodies at ~4.5MB, so shrink the
// rendered canvas before upload by re-encoding onto a smaller canvas.
function compressCanvasForShare(source: HTMLCanvasElement, maxBytes = 4_000_000): string {
  const full = source.toDataURL('image/png');
  if (full.length <= maxBytes) return full;

  const scale = Math.min(1, Math.sqrt(maxBytes / Math.max(1, full.length)) * 0.9);
  const w = Math.max(400, Math.round(source.width * scale));
  const h = Math.max(400, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return full;

  ctx.fillStyle = '#08140e';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);

  let out = canvas.toDataURL('image/png');
  if (out.length > maxBytes) {
    out = canvas.toDataURL('image/jpeg', 0.78);
  }
  return out;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('pfp');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);

  const [badgeDetails, setBadgeDetails] = useState<BadgeDetails>({
    name: '',
    handle: '',
    role: '',
    title: '',
    track: '',
    company: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [renderedDataUrl, setRenderedDataUrl] = useState<string | null>(null);
  const [pfpDataUrl, setPfpDataUrl] = useState<string | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showCardMenu, setShowCardMenu] = useState(false);

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
        if (mode === 'pfp') {
          setPfpDataUrl(dataUrl);
        } else {
          setCardDataUrl(dataUrl);
        }
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
    if (!canvas && !renderedDataUrl) return;

    // Trigger celebratory confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f3c048', '#ff2d75', '#ffffff'],
    });

    try {
      const blob = canvas ? await canvasToBlob(canvas) : await (await fetch(renderedDataUrl!)).blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const filename =
        mode === 'pfp'
          ? 'HH-Goa-PFP.png'
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

    // Open the popup synchronously within the tap gesture — but only when we'll
    // need it. Mobile browsers block window.open() fired after an await, so we
    // open it first and navigate later.
    const popup = window.open('', '_blank');

    // Render a spinner into the popup immediately so it's never a blank page.
    if (popup) {
      try {
        popup.document.write(
          '<!doctype html><html><body style="margin:0;background:#08140e;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;font-family:system-ui;-webkit-font-smoothing:antialiased">' +
            '<div style="width:42px;height:42px;border-radius:50%;border:4px solid rgba(243,192,72,.25);border-top-color:#f3c048;animation:spin 1s linear infinite"></div>' +
            '<p style="color:#fef6e4;font-size:14px;margin:0">Preparing your HH Goa share…</p>' +
            '<style>@keyframes spin{to{transform:rotate(360deg)}}</style></body></html>'
        );
        popup.document.close();
      } catch {
        // Popup already navigated or write blocked; ignore.
      }
    }

    try {
      const sourceCanvas = previewCanvasRef.current;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceCanvas
            ? compressCanvasForShare(sourceCanvas)
            : renderedDataUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      setShareUrl(data.url);

      // Pre-fill the X post with the generated share URL and campaign hashtags
      const shareText = `I just created my official HH Goa 2026 ${mode === 'pfp' ? 'PFP Frame' : 'Builder Badge'
        }! 🌴🔥\n\nCheck it out & create yours:\n${data.url}\n\n#FrameInGoa #HHGoa2026 @HHGoa2026`;

      const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

      if (popup && !popup.closed) {
        try {
          popup.location.href = xIntentUrl;
        } catch {
          window.location.href = xIntentUrl;
        }
      } else {
        window.location.href = xIntentUrl;
      }
    } catch (err) {
      console.error('Share upload failed', err);
      if (popup && !popup.closed) {
        try {
          popup.close();
        } catch {
          // ignore
        }
      }
      alert('Could not prepare your X post. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div 
      className="min-h-screen text-[#fef6e4] font-body-text pb-16 relative overflow-x-hidden bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80")' }}
    >
      {/* Dark green overlay to ensure text readability against the beach background */}
      <div className="absolute inset-0 bg-[#0b6839]/85 z-0 pointer-events-none"></div>
      
      <div className="relative z-10">
        {/* Official HH Goa Hero Banner Section (Full Screen Opening View) */}
        <section className="px-4 py-8 sm:py-12 min-h-screen flex flex-col justify-between relative overflow-hidden">
          <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col justify-between min-h-screen py-4">
            {/* Integrated Top Bar inside Hero */}
            <div className="flex items-center justify-between">
              {/* Hacker House Goa Logo (Left) */}
              <a href="https://hhgoa.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                <img
                  src="/hh-goa-logo.svg"
                  alt="Hacker House Goa"
                  className="h-14 sm:h-20 w-auto object-contain transition transform group-hover:scale-105"
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
                  className="h-12 sm:h-16 w-auto object-contain transition transform group-hover:scale-105"
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
                <div className="bg-[#ff2d75] text-[#facc15] font-black text-3xl sm:text-5xl md:text-6xl px-4 py-1.5 sm:px-6 sm:py-2.5 rounded-3xl border-4 border-[#facc15] shadow-2xl rotate-[-6deg] flex items-center justify-center tracking-wider">
                  गोवा
                </div>
              </div>

              <div className="mt-12 font-playfair text-2xl sm:text-4xl text-[#fef6e4] italic font-bold tracking-wide drop-shadow-lg animate-pulse">
                Goa Wale Beach Peee🤘
              </div>
            </div>

            
          </div>
          
          <MarqueeTicker />
        </section>

        {/* Main App Content Area (Full Page Section) */}
        <main id="main-section" className="max-w-6xl mx-auto px-4 min-h-screen flex flex-col justify-center py-12">

          {/* Interactive Floating  LET'S TRY Notice Board */}
          <section className="text-center my-auto">
            <div className="inline-block mb-4">
              <span className="font-mono text-xs font-bold tracking-[0.3em] text-[#facc15] uppercase">
                 LET'S TRY
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-[#fef6e4] tracking-tight uppercase leading-none mt-1">
                 #FRAMEINGOA
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-2 text-left">
              {/* Card 1: Circular PFP Frame */}
              <div
                onClick={() => openStudio('pfp')}
                className={`group relative bg-[#fffdf0] text-[#1c1917] p-4 sm:p-5 rounded-xl shadow-xl transition-all duration-300 cursor-pointer border-2 ${isStudioOpen && mode === 'pfp'
                    ? 'border-[#ff2d75] ring-4 ring-[#ff2d75]/30'
                    : 'border-[#e2e8f0] hover:border-[#facc15]'
                  }`}
              >
                {/* Fixed Push Pin Anchor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-[#ff528f] via-[#ff2d75] to-[#c7004c] border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/90 shadow-inner" />
                  <div className="absolute top-0.5 left-1 w-1 h-1 rounded-full bg-white/60" />
                </div>

                {/* Active Badge */}
                {isStudioOpen && mode === 'pfp' && (
                  <div className="absolute top-2.5 right-2.5 bg-[#ff2d75] text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Active Mode
                  </div>
                )}

                <div className="text-center pt-2 space-y-2">
                  <h4 className="font-mono text-sm sm:text-base font-bold leading-snug text-[#0f172a]">
                    Frame / ID Card Generator
                  </h4>
                  <p className="font-mono text-[11px] text-[#475569] leading-relaxed">
                    Generate PFP frame overlay with Goa sunrise graphics for X  
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudio('pfp');
                      }}
                      className={`font-serif text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-1.5 mx-auto ${isStudioOpen && mode === 'pfp'
                          ? 'bg-[#ff2d75] text-white shadow-[#ff2d75]/40 scale-105'
                          : 'bg-[#facc15] text-[#08140e] hover:bg-[#ff2d75] hover:text-white'
                        }`}
                    >
                      <span>{isStudioOpen && mode === 'pfp' ? 'PFP STUDIO ACTIVE' : 'OPEN PFP FRAME STUDIO'}</span>
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono text-[10px] text-[#94a3b8] pt-0.5 uppercase">
                     
                  </div>
                </div>
              </div>

              {/* Card 2: Builder Badge ID */}
              <div
                onClick={() => openStudio('card')}
                className={`group relative bg-[#fffdf0] text-[#1c1917] p-4 sm:p-5 rounded-xl shadow-xl transition-all duration-300 cursor-pointer border-2 ${isStudioOpen && mode === 'card'
                    ? 'border-[#ff2d75] ring-4 ring-[#ff2d75]/30'
                    : 'border-[#e2e8f0] hover:border-[#facc15]'
                  }`}
              >
                {/* Fixed Push Pin Anchor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full bg-gradient-to-br from-[#fde047] via-[#facc15] to-[#ca8a04] border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#08140e] opacity-80" />
                  <div className="absolute top-0.5 left-1 w-1 h-1 rounded-full bg-white/70" />
                </div>

                {/* Active Badge */}
                {isStudioOpen && mode === 'card' && (
                  <div className="absolute top-2.5 right-2.5 bg-[#ff2d75] text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Active Mode
                  </div>
                )}

                <div className="text-center pt-2 space-y-2">
                  <h4 className="font-mono text-sm sm:text-base font-bold leading-snug text-[#0f172a]">
                     Floating Card
                  </h4>
                  <p className="font-mono text-[11px] text-[#475569] leading-relaxed">
                    Generate the ID Card First, Then Try this For Better Experience.
                  </p>

                  <div className="pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openStudio('card');
                      }}
                      className={`font-serif text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-1.5 mx-auto ${isStudioOpen && mode === 'card'
                          ? 'bg-[#ff2d75] text-white shadow-[#ff2d75]/40 scale-105'
                          : 'bg-[#facc15] text-[#08140e] hover:bg-[#ff2d75] hover:text-white'
                        }`}
                    >
                      <span>{isStudioOpen && mode === 'card' ? 'BUILDER ID ACTIVE' : 'Get Floating Card'}</span>
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono text-[10px] text-[#94a3b8] pt-0.5 uppercase">
                     
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Generator Studio Workspace - Only visible when a card button is clicked */}
          {isStudioOpen && (
            <div id="generator-studio" className="mt-8 pt-8 animate-fadeIn">
              {/* Top Navigation Bar inside Studio */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#084f2b] p-4 rounded-2xl mb-8 shadow-xl">
                <button
                  onClick={() => setIsStudioOpen(false)}
                  className="flex items-center gap-2 font-mono text-xs font-bold text-[#facc15] hover:text-white bg-[#063b20] px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ← BACK TO  #FRAMEINGOA
                </button>

                <div className="flex items-center justify-center font-mono text-sm font-bold text-[#facc15] bg-[#063b20] p-2 rounded-xl flex-1 mx-4 shadow-inner text-center">
                  {mode === 'pfp' ? 'STEP 1: CUSTOMIZE YOUR FRAME & DETAILS' : 'STEP 2: YOUR 3D BUILDER BADGE'}
                </div>

                <button
                  onClick={() => setIsStudioOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#94a3b8] hover:text-[#ff2d75] transition cursor-pointer"
                >
                  <X className="w-4 h-4" /> Close Studio
                </button>
              </div>

              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${mode === 'card' ? 'hidden' : ''}`}>
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

                  <BadgeForm details={badgeDetails} onChange={setBadgeDetails} />
                </div>

                {/* Right Column: Live Canvas Preview & Action Buttons */}
                <div className="lg:col-span-6 lg:sticky lg:top-24">
                  <div className="bg-[#084f2b] rounded-2xl p-6 shadow-xl text-center">
                    <div className="flex items-center justify-between mb-4 text-left">
                      <div>
                        <h3 className="font-playfair text-xl font-bold text-[#fef6e4]">
                          Live Graphic Preview
                        </h3>
                        <p className="text-xs text-[#cbd5e1] font-mono">
                          800 × 800 Square Canvas
                        </p>
                      </div>

                      {isGenerating && (
                        <span className="text-xs font-mono text-[#f3c048] flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Rendering...
                        </span>
                      )}
                    </div>

                    {/* Live Canvas Render Container */}
                    <div className="relative mx-auto max-w-md bg-[#063b20] rounded-xl overflow-hidden p-2 flex items-center justify-center min-h-[340px]">
                      {renderedDataUrl ? (
                        <img
                          src={renderedDataUrl}
                          alt="Generated HH Goa Graphic"
                          className={`w-full h-auto max-h-[500px] object-contain rounded-lg shadow-lg transition-opacity duration-300 ${isGenerating ? 'opacity-40' : 'opacity-100'}`}
                        />
                      ) : (
                        <div className="p-8 text-[#94a3b8]" />
                      )}

                      {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#063b20]/55 backdrop-blur-[2px] text-[#fef6e4]">
                          <div className="relative flex items-center justify-center">
                            <div className="h-20 w-20 rounded-full border-4 border-[#f3c048]/25 border-t-[#f3c048] border-r-[#ff2d75] animate-spin" />
                            <RefreshCw className="absolute h-7 w-7 text-[#f3c048] animate-pulse" />
                          </div>
                          <div className="text-center">
                            <p className="font-playfair text-lg font-bold">Generating your PFP</p>
                            <p className="mt-1 text-xs font-mono text-[#cbd5e1]">Removing background and rendering...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Main Action Call to Actions */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={handleDownload}
                        disabled={!renderedDataUrl}
                        className="w-full sm:flex-1 bg-[#063b20] hover:bg-[#084f2b] text-[#fef6e4] border-2 border-[#f3c048] font-bold py-3.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download PFP
                      </button>
                      <button
                        onClick={() => setMode('card')}
                        disabled={!renderedDataUrl}
                        className="w-full sm:flex-1 bg-[#ff2d75] hover:bg-[#d9165b] text-white font-bold py-3.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer text-sm"
                      >
                        Get Your ID CARD
                      </button>
                    </div>

                    <button
                      onClick={handleShareToX}
                      disabled={!renderedDataUrl || isSharing}
                      className="mt-3 w-full bg-[#050505] hover:bg-[#1f1f1f] text-white font-bold py-3.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer text-sm"
                    >
                      <XLogo className="w-4 h-4" />
                      {isSharing ? 'Uploading...' : 'Share to X'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Screen Interactive 3D Card Modal Reveal */}
          {isStudioOpen && mode === 'card' && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-cover bg-center animate-fadeIn overflow-hidden"
              style={{ backgroundImage: "url('/footer%20trees.png')" }}
            >
              
              {/* Hamburger Menu Toggle Button */}
              <div className="absolute top-6 right-6 z-30">
                <button
                  onClick={() => setShowCardMenu(!showCardMenu)}
                  className="bg-[#08140e]/80 hover:bg-[#063b20] text-[#fef6e4] border border-[#1b3d2c] p-3 rounded-xl shadow-xl transition-all cursor-pointer backdrop-blur-md"
                >
                  {showCardMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>

              {/* Action Buttons Dropdown Menu */}
              {showCardMenu && (
                <div className="absolute top-20 right-6 w-64 md:w-72 flex flex-col gap-3 md:gap-4 bg-[#08140e]/90 p-5 md:p-6 rounded-3xl backdrop-blur-xl border border-[#1b3d2c]/80 shadow-[0_10px_50px_rgba(0,0,0,0.5)] z-20 animate-fadeIn">
                  <h3 className="font-playfair text-lg font-bold text-[#fef6e4] text-center mb-1">
                    Your Badge is Ready!
                  </h3>
                  
                  <button
                    onClick={handleDownload}
                    disabled={!renderedDataUrl}
                    className="w-full bg-[#f3c048] hover:bg-[#e2b13b] text-[#08140e] font-bold py-3 md:py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(243,192,72,0.3)] disabled:opacity-50 cursor-pointer text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download ID Card
                  </button>
                  <button
                    onClick={handleShareToX}
                    disabled={!renderedDataUrl || isSharing}
                    className="w-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3 md:py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(29,155,240,0.3)] disabled:opacity-50 cursor-pointer text-sm"
                  >
                    <XLogo className="w-4 h-4" />
                    {isSharing ? 'Uploading...' : 'Share to X'}
                  </button>
                  
                  <div className="h-px w-full bg-[#1b3d2c] my-1"></div>
                  
                  <button
                    onClick={() => {
                      setShowCardMenu(false);
                      setMode('pfp');
                    }}
                    className="w-full bg-[#063b20] hover:bg-[#084f2b] text-[#fef6e4] border border-[#94a3b8]/30 font-bold py-3 md:py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Editing
                  </button>
                </div>
              )}

              {/* Massive 3D Physics View (True 100% Full Screen) */}
              <div className="absolute inset-0 w-full h-full drop-shadow-[0_0_80px_rgba(255,45,117,0.3)] z-0">
                <PhysicsCardPreview textureUrl={cardDataUrl} />
              </div>

              {/* Loading overlay while the ID card graphic is rendering */}
              {(isGenerating || !renderedDataUrl) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#063b20]/70 animate-fadeIn">
                  <div className="relative h-20 w-20 [perspective:500px]">
                    <div className="absolute inset-2 rounded-xl border-2 border-[#f3c048] bg-[#08140e]/80 shadow-[0_0_25px_rgba(243,192,72,0.35)] animate-[spin_2.5s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-xl border-2 border-[#ff2d75] bg-[#08140e]/80 shadow-[0_0_25px_rgba(255,45,117,0.3)] animate-[spin_2.5s_linear_infinite_reverse]" />
                    <div className="absolute inset-0 flex items-center justify-center text-[#f3c048]">
                      <RefreshCw className="h-7 w-7 animate-spin" />
                    </div>
                  </div>
                  <p className="mt-5 font-playfair text-lg font-bold text-[#fef6e4] animate-pulse">
                    Generating your 3D ID card
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#cbd5e1]">
                    Building your badge...
                  </p>
                </div>
              )}
            </div>
          )}

          <CountdownTimer />
        </main>
      </div>
    </div>
  );
}
