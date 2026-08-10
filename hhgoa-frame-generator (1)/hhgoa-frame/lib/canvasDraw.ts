export type CropPixels = { x: number; y: number; width: number; height: number };

const GREEN = "#0e3b24";
const GREEN_DARK = "#082818";
const GOLD = "#f6c81a";
const PINK = "#ff2e93";
const CREAM = "#f3efe0";
const INK = "#06180f";

/** Load an <img> from an object URL / data URL and wait for it to decode. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw the cropped region of `image` (per react-easy-crop pixel crop) into a square/rect canvas of `outW x outH`, cover-fit. */
export function cropToCanvas(
  image: HTMLImageElement,
  crop: CropPixels,
  outW: number,
  outH: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH
  );
  return canvas;
}

/** Draw text along a circular arc, centered on `centerAngle` (radians, 0 = up). */
function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  centerAngle: number,
  opts: { font: string; color: string; letterSpacing?: number; flip?: boolean }
) {
  ctx.save();
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const letterSpacing = opts.letterSpacing ?? 0.045;
  const chars = text.split("");
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalAngle = widths.reduce(
    (sum, w) => sum + w / radius + letterSpacing,
    0
  );

  let angle = centerAngle - totalAngle / 2;

  for (let i = 0; i < chars.length; i++) {
    const w = widths[i];
    const charAngle = w / radius;
    angle += charAngle / 2;

    const theta = opts.flip ? Math.PI - angle : angle;
    const x = cx + radius * Math.sin(theta) * (opts.flip ? -1 : 1);
    const y = cy - radius * Math.cos(theta) * (opts.flip ? -1 : 1);

    ctx.save();
    ctx.translate(x, y);
    const rotate = opts.flip ? -theta + Math.PI : theta;
    ctx.rotate(rotate);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();

    angle += charAngle / 2 + letterSpacing;
  }
  ctx.restore();
}

/** Checkerboard ring/strip, echoing the site's ticket-style button. */
function drawChecker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: number
) {
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? GOLD : INK;
      ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
    }
  }
  ctx.restore();
}

/** Flat-vector sunrise: radiating lines + half sun + wavy ocean line. */
function drawSunrise(
  ctx: CanvasRenderingContext2D,
  cx: number,
  horizonY: number,
  sunRadius: number,
  width: number
) {
  // rays
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, sunRadius * 0.05);
  ctx.lineCap = "round";
  const rayCount = 9;
  for (let i = 0; i < rayCount; i++) {
    const t = i / (rayCount - 1);
    const angle = -Math.PI * 0.82 + t * Math.PI * 0.64;
    const r1 = sunRadius * 1.25;
    const r2 = sunRadius * (i % 2 === 0 ? 1.75 : 1.55);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, horizonY - Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, horizonY - Math.sin(angle) * r2);
    ctx.stroke();
  }
  ctx.restore();

  // sun (half-circle sitting on horizon)
  ctx.save();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(cx, horizonY, sunRadius, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // horizon + waves
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, sunRadius * 0.045);
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, horizonY);
  ctx.lineTo(cx + width / 2, horizonY);
  ctx.stroke();

  ctx.globalAlpha = 0.55;
  for (let row = 0; row < 2; row++) {
    const y = horizonY + 16 + row * 14;
    ctx.beginPath();
    const waveW = 18;
    for (let x = cx - width / 2; x < cx + width / 2; x += waveW) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + waveW / 2, y + 6, x + waveW, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Simple flat palm silhouette, roughly bottom-anchored at (x, baseY). */
function drawPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  flip = false
) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(flip ? -scale : scale, scale);
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  // trunk
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -60, 4, -120);
  ctx.stroke();

  // fronds
  const fronds = [
    [-70, -160],
    [-40, -175],
    [0, -182],
    [40, -172],
    [70, -155],
  ];
  for (const [fx, fy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(4, -120);
    ctx.quadraticCurveTo(fx * 0.5, fy * 0.7, fx, fy);
    ctx.quadraticCurveTo(fx * 0.6, fy * 0.75 + 10, 4, -120);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * FORMAT A — PFP Frame/Overlay
 * photoCanvas: already-cropped square user photo (cover-fit).
 * Returns a new 1080x1080 canvas: photo + branded ring overlay.
 */
export function renderFrame(photoCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // photo, full bleed
  ctx.drawImage(photoCanvas, 0, 0, SIZE, SIZE);

  // subtle darkening vignette so gold text stays legible
  const grad = ctx.createRadialGradient(
    SIZE / 2,
    SIZE / 2,
    SIZE * 0.32,
    SIZE / 2,
    SIZE / 2,
    SIZE * 0.62
  );
  grad.addColorStop(0, "rgba(6,24,15,0)");
  grad.addColorStop(1, "rgba(6,24,15,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const ringOuter = SIZE * 0.5;
  const ringWidth = SIZE * 0.052;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // checker ring (outer)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, ringOuter, 0, Math.PI * 2);
  ctx.arc(cx, cy, ringOuter - ringWidth * 0.42, 0, Math.PI * 2, true);
  ctx.clip("evenodd");
  const cell = SIZE * 0.028;
  for (let y = 0; y < SIZE; y += cell) {
    for (let x = 0; x < SIZE; x += cell) {
      const col = Math.floor(x / cell);
      const row = Math.floor(y / cell);
      ctx.fillStyle = (col + row) % 2 === 0 ? GOLD : INK;
      ctx.fillRect(x, y, cell, cell);
    }
  }
  ctx.restore();

  // inner pink hairline
  ctx.save();
  ctx.strokeStyle = PINK;
  ctx.lineWidth = SIZE * 0.006;
  ctx.beginPath();
  ctx.arc(cx, cy, ringOuter - ringWidth * 0.46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // arc text top: HACKER HOUSE
  drawArcText(
    ctx,
    "HACKER HOUSE",
    cx,
    cy,
    ringOuter - ringWidth * 0.62,
    0,
    { font: `700 ${Math.round(SIZE * 0.052)}px "Playfair Display", serif`, color: GOLD, letterSpacing: 0.05 }
  );

  // arc text bottom: GOA . 28-31 OCT 2026
  drawArcText(
    ctx,
    "GOA \u00B7 28\u201331 OCT 2026",
    cx,
    cy,
    ringOuter - ringWidth * 0.62,
    Math.PI,
    {
      font: `600 ${Math.round(SIZE * 0.026)}px "IBM Plex Mono", monospace`,
      color: CREAM,
      letterSpacing: 0.08,
      flip: true,
    }
  );

  // pink badge, bottom-center, overlapping ring (echoes the "गोवा" callout on the poster)
  const badgeW = SIZE * 0.30;
  const badgeH = SIZE * 0.09;
  const badgeX = cx - badgeW / 2;
  const badgeY = SIZE - ringOuter * 0.18 - badgeH / 2;
  ctx.save();
  ctx.fillStyle = PINK;
  const r = badgeH * 0.28;
  ctx.beginPath();
  ctx.moveTo(badgeX + r, badgeY);
  ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, r);
  ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, r);
  ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, r);
  ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = `700 ${Math.round(badgeH * 0.42)}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUILDER", cx, badgeY + badgeH / 2 + 1);
  ctx.restore();

  return canvas;
}

export type IdCardFields = {
  name: string;
  role: string;
  builderTitle: string;
};

/**
 * FORMAT B — Builder ID Card
 * photoCanvas: cropped square user photo.
 * Returns a new 1080x1350 canvas (portrait badge, good for X preview).
 */
export function renderIdCard(
  photoCanvas: HTMLCanvasElement,
  fields: IdCardFields
): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, GREEN);
  bgGrad.addColorStop(1, GREEN_DARK);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // top checker strip
  drawChecker(ctx, 0, 0, W, 14, 14);

  // header
  ctx.save();
  ctx.fillStyle = GOLD;
  ctx.font = `600 26px "IBM Plex Mono", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("2:47 PM STUDIO", 56, 78);
  ctx.textAlign = "right";
  ctx.fillStyle = CREAM;
  ctx.fillText("HACKER HOUSE \u00B7 GOA 2026", W - 56, 78);
  ctx.restore();

  // photo, circular, framed
  const photoR = W * 0.24;
  const photoCx = W / 2;
  const photoCy = 300;

  ctx.save();
  ctx.beginPath();
  ctx.arc(photoCx, photoCy, photoR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(photoCx, photoCy, photoR - 14, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const pSize = (photoR - 14) * 2;
  ctx.drawImage(photoCanvas, photoCx - pSize / 2, photoCy - pSize / 2, pSize, pSize);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(photoCx, photoCy, photoR - 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // name
  ctx.save();
  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  const name = (fields.name || "BUILDER").toUpperCase();
  let nameSize = 84;
  ctx.font = `900 ${nameSize}px "Playfair Display", serif`;
  while (ctx.measureText(name).width > W - 100 && nameSize > 40) {
    nameSize -= 4;
    ctx.font = `900 ${nameSize}px "Playfair Display", serif`;
  }
  ctx.fillText(name, W / 2, photoCy + photoR + 100);
  ctx.restore();

  // role pill
  if (fields.role) {
    ctx.save();
    ctx.font = `600 30px "IBM Plex Mono", monospace`;
    const roleText = fields.role.toUpperCase();
    const padX = 28;
    const textW = ctx.measureText(roleText).width;
    const pillW = textW + padX * 2;
    const pillH = 56;
    const pillX = W / 2 - pillW / 2;
    const pillY = photoCy + photoR + 130;
    ctx.fillStyle = PINK;
    const r = pillH / 2;
    ctx.beginPath();
    ctx.moveTo(pillX + r, pillY);
    ctx.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, r);
    ctx.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, r);
    ctx.arcTo(pillX, pillY + pillH, pillX, pillY, r);
    ctx.arcTo(pillX, pillY, pillX + pillW, pillY, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(roleText, W / 2, pillY + pillH / 2 + 2);
    ctx.restore();
  }

  // builder title
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = `italic 500 34px "Inter", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`\u2014 ${fields.builderTitle} \u2014`, W / 2, photoCy + photoR + 230);
  ctx.restore();

  // sunrise footer motif
  drawPalm(ctx, 70, H - 40, 0.85, false);
  drawPalm(ctx, W - 70, H - 40, 0.85, true);
  drawSunrise(ctx, W / 2, H - 150, 90, W - 340);

  // footer caption
  ctx.save();
  ctx.fillStyle = GOLD;
  ctx.font = `600 26px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.fillText("GOA, INDIA \u00B7 28\u201331 OCT 2026", W / 2, H - 34);
  ctx.restore();

  // bottom checker strip
  drawChecker(ctx, 0, H - 14, W, 14, 14);

  return canvas;
}

/** String-light strand: a sagging line with small glowing bulbs along it. */
function drawStringLights(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  sag: number,
  bulbCount: number
) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 + sag;

  ctx.save();
  ctx.strokeStyle = "rgba(246, 200, 26, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(midX, midY, x2, y2);
  ctx.stroke();
  ctx.restore();

  for (let i = 1; i < bulbCount; i++) {
    const t = i / bulbCount;
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * midY + t * t * y2;

    const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 14);
    glow.addColorStop(0, "rgba(255, 244, 200, 0.9)");
    glow.addColorStop(1, "rgba(255, 244, 200, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bx, by, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff4c8";
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Small dashed-border tag, e.g. "BUILT IN GOA / FOR BUILDERS". */
function drawDashedTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: { text: string; color: string; size: number; weight: string }[]
) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  const r = 10;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineH = h / lines.length;
  lines.forEach((line, i) => {
    ctx.font = `${line.weight} ${line.size}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, x + w / 2, y + lineH * i + lineH / 2 + 2);
  });
  ctx.restore();
}

/** Pink double-ring stamp with stacked centered text, e.g. BUILDER / IN / GOA. */
function drawStampCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lines: string[]
) {
  ctx.save();
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = PINK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineH = r * 0.34;
  const startY = cy - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => {
    ctx.font = `700 ${Math.round(r * 0.24)}px "IBM Plex Mono", monospace`;
    ctx.fillText(line, cx, startY + i * lineH);
  });
  ctx.restore();
}

/**
 * Composite the user's photo into a rect region, feathering the TOP edge
 * to transparent so it visually dissolves into the illustration behind it
 * instead of sitting in a hard box. Also applies a warm color-match tint.
 */
function drawFeatheredPhoto(
  ctx: CanvasRenderingContext2D,
  photoCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  topFeatherPx: number,
  sideFeatherPx = 0
) {
  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = h;
  const lctx = layer.getContext("2d")!;

  lctx.drawImage(photoCanvas, 0, 0, photoCanvas.width, photoCanvas.height, 0, 0, w, h);

  // warm color-match tint so the photo sits naturally in the golden scene
  lctx.globalCompositeOperation = "overlay";
  lctx.fillStyle = "rgba(246, 200, 26, 0.22)";
  lctx.fillRect(0, 0, w, h);
  lctx.globalCompositeOperation = "source-over";
  lctx.fillStyle = "rgba(8, 40, 24, 0.12)";
  lctx.fillRect(0, 0, w, h);

  // Feather top + side edges to transparent, pixel by pixel. (The "normal"
  // way — gradient + globalCompositeOperation="destination-in" — silently
  // zeroes the whole layer on some canvas implementations/offscreen-canvas
  // setups; direct alpha-channel editing is slower but works everywhere.)
  const topF = Math.min(topFeatherPx, h);
  const sideF = Math.min(sideFeatherPx, w / 2);
  const imgData = lctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let row = 0; row < h; row++) {
    const topT = row < topF ? row / topF : 1;
    const rowStart = row * w * 4;
    for (let col = 0; col < w; col++) {
      let sideT = 1;
      if (sideF > 0) {
        if (col < sideF) sideT = col / sideF;
        else if (col > w - sideF) sideT = (w - col) / sideF;
      }
      const t = Math.min(topT, sideT);
      if (t < 1) {
        const i = rowStart + col * 4 + 3; // alpha channel
        data[i] = Math.round(data[i] * t);
      }
    }
  }
  lctx.putImageData(imgData, 0, 0);

  ctx.drawImage(layer, x, y);
}

export const POSTER_SIZE = { width: 1080, height: 1920 } as const;
export const POSTER_PHOTO_AREA = {
  x: 90,
  y: 700,
  width: 1080 - 180,
  height: 1920 - 700 - 210,
} as const;

export type PosterFields = { name?: string };

/**
 * "HH Goa 2026" event poster — the flagship shareable graphic.
 * photoCanvas: user photo already cover-cropped to POSTER_PHOTO_AREA's aspect ratio.
 * Returns a 1080x1920 canvas.
 */
export function renderPoster(
  photoCanvas: HTMLCanvasElement,
  _fields: PosterFields = {}
): HTMLCanvasElement {
  const { width: W, height: H } = POSTER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, GREEN);
  bg.addColorStop(1, GREEN_DARK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // string lights, two strands crossing the header
  drawStringLights(ctx, -40, 70, W * 0.62, 30, 60, 9);
  drawStringLights(ctx, W * 0.2, 40, W + 40, 480, 90, 11);

  // beach scene behind the photo
  const sunCx = W / 2;
  const sunHorizonY = POSTER_PHOTO_AREA.y + 170;
  drawSunrise(ctx, sunCx, sunHorizonY, 300, W - 120);
  drawPalm(ctx, 34, POSTER_PHOTO_AREA.y + 460, 1.15, false);
  drawPalm(ctx, W - 34, POSTER_PHOTO_AREA.y + 420, 1.05, true);

  // photo, feathered into the sun/scene above and softened at the sides
  drawFeatheredPhoto(
    ctx,
    photoCanvas,
    POSTER_PHOTO_AREA.x,
    POSTER_PHOTO_AREA.y,
    POSTER_PHOTO_AREA.width,
    POSTER_PHOTO_AREA.height,
    220,
    50
  );

  // ---- header text block (drawn after the photo/scene so it stays crisp) ----

  // top-left: HH / GOA🌴 / 2026
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = GOLD;
  ctx.font = `900 56px "Playfair Display", serif`;
  ctx.fillText("HH", 56, 92);
  ctx.fillText("GOA", 56, 152);
  ctx.font = "38px sans-serif";
  ctx.fillText("\u{1F334}", 190, 150);
  ctx.font = `900 56px "Playfair Display", serif`;
  ctx.fillText("2026", 56, 212);
  ctx.restore();

  // top-right dashed tag
  drawDashedTag(ctx, W - 380, 50, 324, 120, [
    { text: "BUILT IN GOA", color: GOLD, size: 24, weight: "600" },
    { text: "FOR BUILDERS", color: PINK, size: 32, weight: "700" },
  ]);

  // wordmark: HACKER ... HOUSE
  ctx.save();
  ctx.font = `900 128px "Playfair Display", serif`;
  ctx.fillStyle = GOLD;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText("HACKER", 40, 430);
  ctx.textAlign = "right";
  ctx.fillText("HOUSE", W - 40, 430);
  ctx.restore();

  // गोवा badge, overlapping the wordmark
  ctx.save();
  ctx.translate(W / 2, 400);
  ctx.rotate(-0.07);
  const badgeW = 250;
  const badgeH = 120;
  ctx.fillStyle = PINK;
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(-badgeW / 2 + r, -badgeH / 2);
  ctx.arcTo(badgeW / 2, -badgeH / 2, badgeW / 2, badgeH / 2, r);
  ctx.arcTo(badgeW / 2, badgeH / 2, -badgeW / 2, badgeH / 2, r);
  ctx.arcTo(-badgeW / 2, badgeH / 2, -badgeW / 2, -badgeH / 2, r);
  ctx.arcTo(-badgeW / 2, -badgeH / 2, badgeW / 2, -badgeH / 2, r);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = GOLD;
  ctx.font = `800 64px "Noto Sans Devanagari", "Playfair Display", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u0917\u094B\u0935\u093E", 0, 6);
  ctx.restore();

  // subtitle + underline
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = `600 34px "IBM Plex Mono", monospace`;
  ctx.textAlign = "left";
  ctx.fillText("GOA, INDIA \u2014 28\u201331 OCT 2026", 56, 500);
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(56, 520);
  ctx.lineTo(176, 520);
  ctx.stroke();
  ctx.restore();

  // pink stamp
  drawStampCircle(ctx, W - 170, 660, 130, ["BUILDER", "IN", "GOA"]);

  // ---- bottom diagonal banner ----
  const bannerY = H - 190;
  const bannerH = 110;
  const slant = 26;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, bannerY - slant / 2);
  ctx.lineTo(W, bannerY + slant / 2);
  ctx.lineTo(W, bannerY + slant / 2 + bannerH);
  ctx.lineTo(0, bannerY - slant / 2 + bannerH);
  ctx.closePath();
  ctx.fillStyle = GREEN_DARK;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.clip();

  ctx.fillStyle = PINK;
  ctx.font = `800 44px "IBM Plex Mono", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("# #FRAMEINGOA", 56, bannerY + bannerH / 2 + 8);
  ctx.restore();

  // HH logo circle, overlapping the banner on the right
  const logoCx = W - 120;
  const logoCy = bannerY + bannerH / 2 - 4;
  ctx.save();
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.arc(logoCx, logoCy, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = `900 34px "Playfair Display", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HH", logoCx, logoCy - 8);
  ctx.font = `600 16px "IBM Plex Mono", monospace`;
  ctx.fillText("2:47PM", logoCx, logoCy + 22);
  ctx.restore();

  return canvas;
}

/** Export a canvas as a PNG Blob. */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not export canvas"));
    }, "image/png", 0.95);
  });
}
