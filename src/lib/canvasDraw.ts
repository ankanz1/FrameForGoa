import { CropArea, BadgeDetails, Mode } from '../types';

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

  // Load user cropped photo if available
  let imgElement: HTMLImageElement | null = null;
  if (imageSrc) {
    try {
      imgElement = await loadImage(imageSrc);
    } catch (e) {
      console.warn('Could not load user image', e);
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
    // 800 x 800 Square Profile Picture Frame
    canvas.width = 800;
    canvas.height = 800;
    drawPfpFrame(ctx, imgElement, cropArea, studioLogoImg);
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
function drawPfpFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cropArea: CropArea | null,
  studioLogoImg: HTMLImageElement | null = null
) {
  const size = 800;
  const centerX = size / 2;
  const centerY = size / 2;

  // 1. Fill background with tropical radial gradient
  const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
  bgGrad.addColorStop(0, '#144c2e'); // Lighter tropical green center
  bgGrad.addColorStop(1, BRAND.bgDark);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Decorative subtle background grid
  drawBackgroundGrid(ctx, size, size);

  // Outer decorative ring radii
  const photoRadius = 280;
  const outerRingRadius = photoRadius + 45;

  // 2. Draw user photo inside circular clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, photoRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img && cropArea) {
    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      centerX - photoRadius,
      centerY - photoRadius,
      photoRadius * 2,
      photoRadius * 2
    );
  } else if (img) {
    // Default cover fit
    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;
    ctx.drawImage(
      img,
      sx,
      sy,
      minDim,
      minDim,
      centerX - photoRadius,
      centerY - photoRadius,
      photoRadius * 2,
      photoRadius * 2
    );
  } else {
    // Placeholder avatar pattern
    ctx.fillStyle = '#1e3a2b';
    ctx.fillRect(centerX - photoRadius, centerY - photoRadius, photoRadius * 2, photoRadius * 2);
    ctx.fillStyle = BRAND.accentGold;
    ctx.font = 'bold 120px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HH', centerX, centerY);
  }
  ctx.restore();

  // Photo inner gold stroke border
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, photoRadius, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = BRAND.accentGold;
  ctx.shadowColor = BRAND.accentGold;
  ctx.shadowBlur = 15;
  ctx.stroke();
  ctx.restore();

  // 3. Draw Checkerboard Gold Ring around photo
  drawCheckerboardRing(ctx, centerX, centerY, photoRadius + 12, photoRadius + 36, 48);

  // Outer Gold Border Stroke
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRingRadius, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = BRAND.accentGold;
  ctx.stroke();

  // 4. Arced Text on Top Arc
  drawArcText(
    ctx,
    'HACKER HOUSE GOA • OCT 2026',
    centerX,
    centerY,
    photoRadius + 24,
    -Math.PI / 2, // top center
    true, // curve upward
    'bold 28px "IBM Plex Mono", monospace',
    BRAND.cream
  );

  // Arced Text "• SHIPPED IN GOA • SHIPPED IN GOA •" on Bottom Arc
  drawArcText(
    ctx,
    '• SHIPPED IN GOA • SHIPPED IN GOA •',
    centerX,
    centerY,
    photoRadius + 24,
    Math.PI / 2, // bottom center
    false, // curve downward
    'bold 22px "IBM Plex Mono", monospace',
    BRAND.accentGold
  );

  // 5. Corner Decorative Ticket Stamps / Motifs
  drawCornerAccents(ctx, size, size);

  // 6. Bottom Banner Badge "HH GOA 2026"
  const bannerWidth = 420;
  const bannerHeight = 64;
  const bannerX = centerX - bannerWidth / 2;
  const bannerY = size - 110;

  // Banner background with pink/orange gradient
  ctx.save();
  const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerWidth, bannerY);
  bannerGrad.addColorStop(0, BRAND.accentPink);
  bannerGrad.addColorStop(1, '#ff6b2b'); // sunset orange
  ctx.fillStyle = bannerGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 32);
  ctx.fill();

  // Banner inner gold border
  ctx.strokeStyle = BRAND.accentGold;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Banner text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'transparent';
  ctx.fillText('HH GOA 2026', centerX, bannerY + bannerHeight / 2 - 2);

  // Subtitle "गोवा" in hot pink / white contrast
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = BRAND.accentGold;
  ctx.fillText('BUILDER EDITION', centerX, bannerY + bannerHeight + 24);

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
