import { CropArea, BadgeDetails, Mode } from '../types';
import { removeBackground } from '../services/removeBackground';

/**
 * Brand Color Palette
 */
const BRAND = {
  bgDark: '#08140e',
  bgCard: '#0f241a',
  accentGold: '#f3c048',
  lightGold: '#fde68a',
  accentPink: '#ff2d75',
  cream: '#fef6e4',
  textLight: '#ffffff',
  textMuted: '#94a3b8',
  darkGreen: '#040b07',
  forestGreen: '#143827'
};

/**
 * Main draw function supporting PFP Frame (800x800) and Builder Badge ID Card (800x1100)
 */
export async function drawCanvas(
  mode: Mode,
  imageSrc: string | null,
  cropArea: CropArea | null,
  badgeDetails: BadgeDetails
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Load the user's image, removing its background for the fixed PFP composition.
  let imgElement: HTMLImageElement | null = null;
  if (imageSrc) {
    try {
      const source = mode === 'pfp' ? await removeBackground(imageSrc) : imageSrc;
      imgElement = await loadImage(source);
    } catch (e) {
      console.warn('Could not load user image', e);
      try {
        imgElement = await loadImage(imageSrc);
      } catch (fallbackError) {
        console.warn('Could not load fallback user image', fallbackError);
      }
    }
  }

  // Load 2:41 PM Studio Logo
  let studioLogoImg: HTMLImageElement | null = null;
  try {
    studioLogoImg = await loadImage('/studio-logo.svg');
  } catch (e) {
    console.warn('Could not load studio logo', e);
  }

  if (mode === 'pfp') {
    canvas.width = 2048;
    canvas.height = 2048;
    await drawPfpFrame(ctx, imgElement, cropArea);
  } else {
    // 800 x 1100 Portrait Builder Badge ID Card
    canvas.width = 800;
    canvas.height = 1100;
    drawBuilderBadge(ctx, imgElement, cropArea, badgeDetails, studioLogoImg);
  }

  return canvas;
}

/**
 * Draws the PFP Frame (800x800)
 */
async function drawPfpFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cropArea: CropArea | null
) {
  const size = 2048;
  const centerX = size / 2;
  const sunCenterY = 1475;
  const sunRadius = 590;
  const [ring, texture] = await Promise.all([
    loadImage('/assets/hhgoa/brush-ring.svg'),
    loadImage('/assets/hhgoa/texture.svg'),
  ]);

  ctx.fillStyle = '#0D5B3A';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = ctx.createPattern(texture, 'repeat') ?? '#0D5B3A';
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#FFD21C';
  ctx.beginPath();
  ctx.arc(centerX, sunCenterY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  if (img) {
    const bounds = findOpaqueBounds(img);
    if (bounds) drawPfpSubject(ctx, img, bounds, cropArea, centerX, sunCenterY, sunRadius);
  }

  ctx.drawImage(ring, centerX - 720, sunCenterY - 720, 1440, 1440);
  drawPfpBranding(ctx, size);
}

interface ImageBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function findOpaqueBounds(img: HTMLImageElement): ImageBounds | null {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 18) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function drawPfpSubject(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  bounds: ImageBounds,
  cropArea: CropArea | null,
  centerX: number,
  sunCenterY: number,
  sunRadius: number
) {
  const maxWidth = sunRadius * 1.55;
  const maxHeight = 1400;
  const zoom = cropArea ? Math.min(img.naturalWidth / cropArea.width, img.naturalHeight / cropArea.height) : 1;
  const scale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height) * Math.min(zoom, 2.25);
  const width = bounds.width * scale;
  const height = bounds.height * scale;
  const cropCenterX = cropArea ? cropArea.x + cropArea.width / 2 : bounds.x + bounds.width / 2;
  const cropCenterY = cropArea ? cropArea.y + cropArea.height / 2 : bounds.y + bounds.height / 2;
  const subjectXRatio = cropArea ? (bounds.x + bounds.width / 2 - cropCenterX) / cropArea.width : 0;
  const subjectYRatio = cropArea ? (bounds.y + bounds.height / 2 - cropCenterY) / cropArea.height : 0;
  const x = centerX - width / 2 + subjectXRatio * sunRadius * 2;
  const y = Math.max(870, Math.min(2015 - height, sunCenterY - height / 2 + subjectYRatio * sunRadius * 2));
  ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height, x, y, width, height);
}

function drawPfpBranding(ctx: CanvasRenderingContext2D, size: number) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFD21C';
  ctx.font = '900 124px Georgia, serif';
  ctx.fillText('HH', 82, 78);
  ctx.fillText('GOA', 82, 198);
  ctx.fillText('2026', 82, 318);

  ctx.fillStyle = '#FF3F83';
  ctx.strokeStyle = '#FF3F83';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(290, 270);
  ctx.lineTo(325, 142);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI + (i / 6) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(325, 150);
    ctx.quadraticCurveTo(325 + Math.cos(angle) * 80, 80 + Math.sin(angle) * 65, 325 + Math.cos(angle) * 145, 75 + Math.sin(angle) * 95);
    ctx.stroke();
  }

  ctx.font = '900 190px Georgia, serif';
  ctx.fillStyle = '#FFD21C';
  ctx.fillText('HACKER HOUSE', 78, 490);
  ctx.font = '900 134px sans-serif';
  ctx.fillStyle = '#FF3F83';
  ctx.strokeStyle = '#FFD21C';
  ctx.lineWidth = 12;
  ctx.strokeText('गोवा', size / 2 - 150, 690);
  ctx.fillText('गोवा', size / 2 - 150, 690);

  ctx.font = '900 48px Arial, sans-serif';
  ctx.fillStyle = '#FFD21C';
  ctx.fillText('—  GOA, INDIA   •   28 – 31 OCT 2026   •   BUILT IN GOA FOR BUILDERS  —', 82, 838);

  ctx.save();
  ctx.translate(1600, 80);
  ctx.rotate(-0.12);
  ctx.strokeStyle = '#FFD21C';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 365, 205);
  ctx.font = '900 48px Arial, sans-serif';
  ctx.fillStyle = '#FFD21C';
  ctx.fillText('BUILT IN GOA', 25, 38);
  ctx.fillStyle = '#FF3F83';
  ctx.fillText('FOR BUILDERS', 25, 105);
  ctx.restore();
}

/**
 * Draws the Builder Badge ID Card (800x1100)
 */
function drawBuilderBadge(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cropArea: CropArea | null,
  badge: BadgeDetails,
  studioLogoImg: HTMLImageElement | null = null
) {
  const width = 800;
  const height = 1100;

  // 1. Dark Tropical Canvas Background
  ctx.fillStyle = BRAND.bgDark;
  ctx.fillRect(0, 0, width, height);

  drawBackgroundGrid(ctx, width, height);

  // 2. Outer Card Container (with rounded corners and gold border)
  const margin = 36;
  const cardWidth = width - margin * 2;
  const cardHeight = height - margin * 2;

  ctx.save();
  // Card base
  ctx.fillStyle = BRAND.bgCard;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(margin, margin, cardWidth, cardHeight, 28);
  ctx.fill();

  // Card Outer Double Border
  ctx.strokeStyle = BRAND.accentGold;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(243, 192, 72, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(margin + 8, margin + 8, cardWidth - 16, cardHeight - 16, 20);
  ctx.stroke();
  ctx.restore();

  // 3. Card Header (Sunrise over ocean + HH Goa brand text & Studio Logo)
  drawHeaderArtwork(ctx, margin, margin, cardWidth, 180, studioLogoImg);

  // 4. Lanyard Slot Notch at Top Center
  ctx.save();
  ctx.fillStyle = BRAND.darkGreen;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 45, margin + 12, 90, 16, 8);
  ctx.fill();
  ctx.strokeStyle = BRAND.accentGold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 5. User Photo Frame (Portrait 280x320 with rounded corners)
  const photoX = width / 2 - 140;
  const photoY = 240;
  const photoW = 280;
  const photoH = 320;

  ctx.save();
  // Photo frame backing shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#122e20';
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 20);
  ctx.fill();
  ctx.restore();

  // Clip user photo
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 20);
  ctx.clip();

  if (img && cropArea) {
    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      photoX,
      photoY,
      photoW,
      photoH
    );
  } else if (img) {
    ctx.drawImage(img, photoX, photoY, photoW, photoH);
  } else {
    // Placeholder avatar
    ctx.fillStyle = '#1c3d2f';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.fillStyle = BRAND.accentGold;
    ctx.font = 'bold 80px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOA', photoX + photoW / 2, photoY + photoH / 2);
  }
  ctx.restore();

  // Photo frame gold border & corner flourishes
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 20);
  ctx.lineWidth = 4;
  ctx.strokeStyle = BRAND.accentGold;
  ctx.stroke();

  // Checkerboard accent strips on photo sides
  drawCheckerboardStrip(ctx, photoX - 16, photoY, 12, photoH, 6);
  drawCheckerboardStrip(ctx, photoX + photoW + 4, photoY, 12, photoH, 6);

  // 6. Name and Handle Section
  let currentY = photoY + photoH + 36;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Name
  ctx.fillStyle = BRAND.cream;
  const displayName = (badge.name || 'ANONYMOUS BUILDER').toUpperCase();
  ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
  ctx.fillText(truncateText(ctx, displayName, cardWidth - 80), width / 2, currentY);

  currentY += 46;

  // Handle / Social
  if (badge.handle) {
    const handleText = badge.handle.startsWith('@') ? badge.handle : `@${badge.handle}`;
    ctx.fillStyle = BRAND.accentGold;
    ctx.font = 'bold 22px "IBM Plex Mono", monospace';
    ctx.fillText(handleText, width / 2, currentY);
    currentY += 36;
  }

  // 7. Whimsical Builder Title Banner
  const titleBoxW = cardWidth - 100;
  const titleBoxH = 50;
  const titleBoxX = width / 2 - titleBoxW / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 45, 117, 0.15)';
  ctx.beginPath();
  ctx.roundRect(titleBoxX, currentY, titleBoxW, titleBoxH, 12);
  ctx.fill();

  ctx.strokeStyle = BRAND.accentPink;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = BRAND.accentPink;
  ctx.font = 'bold 20px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const displayTitle = badge.title || 'Full-Stack Wizard of Goa';
  ctx.fillText(truncateText(ctx, displayTitle, titleBoxW - 24), width / 2, currentY + titleBoxH / 2);
  ctx.restore();

  currentY += titleBoxH + 30;

  // 8. Grid Information Fields (Track, Role, Company)
  const gridY = currentY;
  const colWidth = (cardWidth - 80) / 2;
  const leftX = margin + 40;
  const rightX = leftX + colWidth;

  // Column 1: TRACK / STACK
  drawDetailItem(
    ctx,
    'TRACK / STACK',
    badge.track || 'AI & Full-Stack',
    leftX,
    gridY,
    colWidth
  );

  // Column 2: ROLE
  drawDetailItem(
    ctx,
    'ROLE',
    badge.role || 'Hacker / Founder',
    rightX,
    gridY,
    colWidth
  );

  // Row 2: AFFILIATION / PROJECT
  drawDetailItem(
    ctx,
    'PROJECT / AFFILIATION',
    badge.company || 'Building in Public',
    leftX,
    gridY + 68,
    cardWidth - 80
  );

  // 9. Card Footer Bar with Barcode / Ticket Notch & Stamp
  const footerY = height - margin - 110;
  drawBadgeFooter(ctx, margin, footerY, cardWidth, 110);
}

/**
 * Helper to draw detail key-value items
 */
function drawDetailItem(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  maxW: number
) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Label
  ctx.fillStyle = BRAND.accentGold;
  ctx.font = '700 13px "IBM Plex Mono", monospace';
  ctx.fillText(label, x, y);

  // Value
  ctx.fillStyle = BRAND.cream;
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(truncateText(ctx, value, maxW - 10), x, y + 20);
  ctx.restore();
}

/**
 * Draws top header artwork (Sunrise over waves + Brand text)
 */
function drawHeaderArtwork(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  studioLogoImg: HTMLImageElement | null = null
) {
  ctx.save();
  // Clip header area
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, [28, 28, 0, 0]);
  ctx.clip();

  // Header background gradient
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#153826');
  grad.addColorStop(1, '#0c2217');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Sunrise rays motif
  const cx = x + w / 2;
  const cy = y + h - 20;
  const rayCount = 13;
  ctx.strokeStyle = 'rgba(243, 192, 72, 0.12)';
  ctx.lineWidth = 14;

  for (let i = 0; i < rayCount; i++) {
    const angle = Math.PI + (i / (rayCount - 1)) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 300, cy + Math.sin(angle) * 300);
    ctx.stroke();
  }

  // Sun disc
  ctx.fillStyle = BRAND.accentGold;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, Math.PI, 0, false);
  ctx.fill();

  // Draw Studio Logo if available
  if (studioLogoImg) {
    const logoW = 100;
    const logoH = 50;
    ctx.drawImage(studioLogoImg, cx - logoW / 2, y + 15, logoW, logoH);

    // Brand Header Title below logo
    ctx.fillStyle = BRAND.cream;
    ctx.font = '900 32px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HACKER HOUSE GOA', cx, y + 80);

    // Subtitle / Date
    ctx.fillStyle = BRAND.accentPink;
    ctx.font = 'bold 15px "IBM Plex Mono", monospace';
    ctx.fillText('OFFICIAL BUILDER PASS • 2026', cx, y + 115);
  } else {
    // Brand Header Title
    ctx.fillStyle = BRAND.cream;
    ctx.font = '900 36px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HACKER HOUSE GOA', cx, y + 55);

    // Subtitle / Date
    ctx.fillStyle = BRAND.accentPink;
    ctx.font = 'bold 16px "IBM Plex Mono", monospace';
    ctx.fillText('OFFICIAL BUILDER PASS • 2026', cx, y + 95);
  }

  // Header bottom border line
  ctx.strokeStyle = BRAND.accentGold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws badge footer with simulated barcode and ticket stamps
 */
function drawBadgeFooter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();

  // Footer top divider line
  ctx.strokeStyle = 'rgba(243, 192, 72, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + w - 20, y);
  ctx.stroke();

  // Left simulated barcode
  const codeX = x + 40;
  const codeY = y + 25;
  const codeH = 45;

  ctx.fillStyle = BRAND.cream;
  const barWidths = [3, 1, 4, 2, 1, 5, 2, 1, 3, 2, 4, 1, 2, 5, 2, 1, 4, 2, 3];
  let currBarX = codeX;

  for (const bw of barWidths) {
    ctx.fillRect(currBarX, codeY, bw, codeH);
    currBarX += bw + 3;
  }

  ctx.fillStyle = BRAND.accentGold;
  ctx.font = '12px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HHGOA-2026-BUILDER', codeX, codeY + codeH + 18);

  // Right Official Stamp Motif
  const stampX = x + w - 120;
  const stampY = y + 50;

  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate(-0.15); // slightly angled stamp

  ctx.strokeStyle = BRAND.accentPink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = BRAND.accentPink;
  ctx.font = 'bold 12px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VERIFIED', 0, -8);
  ctx.fillText('GOA 2026', 0, 10);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws checkerboard ring pattern around PFP photo
 */
function drawCheckerboardRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  segments: number
) {
  const angleStep = (Math.PI * 2) / segments;

  for (let i = 0; i < segments; i++) {
    const startAngle = i * angleStep;
    const endAngle = (i + 1) * angleStep;

    ctx.fillStyle = i % 2 === 0 ? BRAND.accentGold : BRAND.darkGreen;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle, false);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draws checkerboard vertical strip
 */
function drawCheckerboardStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  squareSize: number
) {
  ctx.save();
  const rows = Math.floor(h / squareSize);
  const cols = Math.floor(w / squareSize);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? BRAND.accentGold : BRAND.bgDark;
      ctx.fillRect(x + c * squareSize, y + r * squareSize, squareSize, squareSize);
    }
  }
  ctx.restore();
}

/**
 * Renders curved text along circular arc
 */
function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  centerAngle: number,
  curveUp: boolean,
  font: string,
  color: string
) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const totalAngle = (text.length * 16) / radius; // angle span estimate
  let startAngle = centerAngle - totalAngle / 2;

  if (!curveUp) {
    // Reverse direction for bottom arc readable left-to-right
    startAngle = centerAngle + totalAngle / 2;
  }

  const charStep = totalAngle / text.length;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const angle = curveUp
      ? startAngle + i * charStep
      : startAngle - i * charStep;

    ctx.save();
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    ctx.translate(x, y);
    ctx.rotate(curveUp ? angle + Math.PI / 2 : angle - Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Background tropical grid pattern
 */
function drawBackgroundGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(243, 192, 72, 0.04)';
  ctx.lineWidth = 1;

  const step = 40;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Decorative ticket stamps in canvas corners
 */
function drawCornerAccents(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = BRAND.accentGold;
  ctx.lineWidth = 3;

  const size = 30;
  const pad = 25;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(pad, pad + size);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + size, pad);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(w - pad - size, pad);
  ctx.lineTo(w - pad, pad);
  ctx.lineTo(w - pad, pad + size);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(pad, h - pad - size);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(pad + size, h - pad);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(w - pad - size, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.lineTo(w - pad, h - pad - size);
  ctx.stroke();

  ctx.restore();
}

/**
 * Truncate long strings with ellipsis if overflowing
 */
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxW) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/**
 * Utility helper to load an image element asynchronously
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Export a canvas as a PNG Blob at native resolution
 */
export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas.toBlob returned null'));
    }, 'image/png');
  });
}
