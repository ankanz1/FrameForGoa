import { CropArea, BadgeDetails, Mode } from '../types';

/**
 * Brand Color Palette (from hhgoa.com)
 */
const GREEN = '#0b6839';
const GREEN_DARK = '#082818';
const GOLD = '#f6c81a';
const PINK = '#ff2e93';
const CREAM = '#f3efe0';
const INK = '#06180f';

export type CropPixels = { x: number; y: number; width: number; height: number };

export type IdCardFields = {
  name: string;
  role: string;
  builderTitle: string;
};

/**
 * Main draw function supporting PFP Frame (1080x1080) and Builder Badge ID Card (1080x1350)
 */
export async function drawCanvas(
  mode: Mode,
  imageSrc: string | null,
  cropArea: CropArea | null,
  badgeDetails: BadgeDetails
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  let imgElement: HTMLImageElement | null = null;
  if (imageSrc) {
    try {
      imgElement = await loadImage(imageSrc);
    } catch (e) {
      console.warn('Could not load user image', e);
    }
  }

  if (mode === 'pfp') {
    // 1080 x 1080 Square Profile Picture Frame
    const photo = imgElement
      ? cropToCanvas(imgElement, toSquareCrop(cropArea, imgElement), 1080, 1080)
      : placeholderPhoto(1080, 1080, 'HH');
    return renderFrame(photo);
  }

  // 1080 x 1350 Portrait Builder Badge ID Card
  const photo = imgElement
    ? cropToCanvas(imgElement, toSquareCrop(cropArea, imgElement), 900, 900)
    : placeholderPhoto(900, 900, 'GOA');
  return renderIdCard(photo, {
    name: badgeDetails.name || 'ANONYMOUS BUILDER',
    role: badgeDetails.role || 'Hacker / Founder',
    builderTitle: badgeDetails.title || 'Full-Stack Wizard of Goa',
  });
}

/**
 * Derives a centered square crop from the current (image-aspect) crop area.
 */
function toSquareCrop(crop: CropArea | null, img: HTMLImageElement): CropPixels {
  if (crop && crop.width > 0 && crop.height > 0) {
    const size = Math.min(crop.width, crop.height);
    return {
      x: crop.x + (crop.width - size) / 2,
      y: crop.y + (crop.height - size) / 2,
      width: size,
      height: size,
    };
  }
  // Default centered square cover fit
  const size = Math.min(img.naturalWidth, img.naturalHeight);
  return {
    x: (img.naturalWidth - size) / 2,
    y: (img.naturalHeight - size) / 2,
    width: size,
    height: size,
  };
}

/**
 * Blank placeholder photo canvas with a monogram, so renderers always have a source.
 */
function placeholderPhoto(w: number, h: number, label: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = GREEN_DARK;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GOLD;
  ctx.font = `900 ${Math.round(w * 0.14)}px "Playfair Display", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, w / 2, h / 2);
  return canvas;
}

/** Load an <img> element asynchronously. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw the cropped region of `image` into a canvas of `outW x outH`, cover-fit. */
export function cropToCanvas(
  image: HTMLImageElement,
  crop: CropPixels,
  outW: number,
  outH: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
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
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const letterSpacing = opts.letterSpacing ?? 0.045;
  const chars = text.split('');
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
  ctx.lineCap = 'round';
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
  ctx.lineCap = 'round';

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
 * FORMAT A — PFP Frame (1080x1080)
 * photoCanvas: already-cropped square user photo (cover-fit).
 * Returns a new 1080x1080 canvas: photo + branded ring overlay.
 */
export function renderFrame(photoCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

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
  grad.addColorStop(0, 'rgba(6,24,15,0)');
  grad.addColorStop(1, 'rgba(6,24,15,0.55)');
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
  ctx.clip('evenodd');
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
    'HACKER HOUSE',
    cx,
    cy,
    ringOuter - ringWidth * 0.62,
    0,
    {
      font: `700 ${Math.round(SIZE * 0.052)}px "Playfair Display", serif`,
      color: GOLD,
      letterSpacing: 0.05,
    }
  );

  // arc text bottom: GOA . 28-31 OCT 2026
  drawArcText(
    ctx,
    'GOA \u00B7 28\u201331 OCT 2026',
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
  const badgeW = SIZE * 0.3;
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
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BUILDER', cx, badgeY + badgeH / 2 + 1);
  ctx.restore();

  return canvas;
}

/**
 * FORMAT B — Builder ID Card (1080x1350)
 * photoCanvas: cropped square user photo.
 * Returns a new 1080x1350 canvas (portrait badge, good for X preview).
 */
export function renderIdCard(
  photoCanvas: HTMLCanvasElement,
  fields: IdCardFields
): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

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
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('2:47 PM STUDIO', 56, 78);
  ctx.textAlign = 'right';
  ctx.fillStyle = CREAM;
  ctx.fillText('HACKER HOUSE \u00B7 GOA 2026', W - 56, 78);
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
  ctx.textAlign = 'center';
  const name = (fields.name || 'BUILDER').toUpperCase();
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
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(roleText, W / 2, pillY + pillH / 2 + 2);
    ctx.restore();
  }

  // builder title
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = `italic 500 34px "Inter", sans-serif`;
  ctx.textAlign = 'center';
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
  ctx.textAlign = 'center';
  ctx.fillText('GOA, INDIA \u00B7 28\u201331 OCT 2026', W / 2, H - 34);
  ctx.restore();

  // bottom checker strip
  drawChecker(ctx, 0, H - 14, W, 14, 14);

  return canvas;
}

/** Export a canvas as a PNG Blob. */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not export canvas'));
    }, 'image/png', 0.95);
  });
}
