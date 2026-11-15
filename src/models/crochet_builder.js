import * as THREE from 'three';

/**
 * 1 Three.js unit = 1.0 cm. Y = 0 is the bottom exterior of the crochet case.
 * Front of tumbler/character faces +Z. Left side is -X, Right side is +X, Back is -Z.
 */
export const TUMBLER_SPECS = {
  baseRadius: 4.0,            // Ø 8.0 cm
  barrelTopY: 21.5,           // Straight black barrel y = 0.0 - 21.5 cm
  shoulderTopY: 24.8,         // Rounded convex dome shoulder y = 21.5 - 24.8 cm
  neckRadius: 2.85,           // Ø 5.7 cm (fit target Ø 5.6 - 5.8 cm)
  neckBandStartY: 26.0,       // Brushed silver collar starts at y = 26.0 cm
  neckTopY: 27.8,             // Vertical neck ends at y = 27.8 cm
  capRadius: 2.95,            // Ø 5.9 cm black screw cap body
  capTopY: 30.4,
  totalHeightY: 32.0,         // Top of flip-straw nozzle & thumb tab
  caseWallThickness: 0.36,    // Tight Polycherry D27 crochet wall gauge
  caseNeckOuterRadius: 3.24,  // Crochet cuff outer radius around Ø 5.7 cm neck
  siliconeRingBottomY: 26.78, // Matte-black Silicone Neck Ring y = 26.78 - 27.63 cm
  siliconeRingTopY: 27.63,
  siliconeRingOuterRadius: 3.58,
  drawstringY: 25.80,         // Woven eyelet drawstring line y = 25.5 - 26.1 cm
  shortStrapLengthCm: 30.0,
  longStrapLengthCm: 100.0
};

export const CHARACTER_PALETTES = {
  sceptile: {
    base: '#68C481',
    anchorDark: '#438D5A',
    body: '#68C481',
    belt: '#D6615D',
    chestBand: '#438D5A',
    eyeYellow: '#E4D17C',
    eyeTrim: '#C64D4D',
    seedYellow: '#E4D17C',
    leafDark: '#438D5A',
    leafMid: '#68C481',
    strapColors: ['#2F593D', '#68C481', '#E4D17C'],
    cuffColor: '#D6615D',
    cordEndColor: '#E4D17C',
    tackColor: '#68C481'
  },
  dragonite: {
    base: '#EC9D41',
    anchorDark: '#B56B22',
    body: '#EC9D41',
    bellyCream: '#EAD8B3',
    bellyRib: '#C2AA7B',
    wingTeal: '#167B75',
    irisOlive: '#566A56',
    clawWhite: '#DCE0E5',
    strapColors: ['#EC9D41', '#167B75', '#EAD8B3'],
    cuffColor: '#EAD8B3',
    cordEndColor: '#EAD8B3',
    tackColor: '#EAD8B3'
  }
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shared exact radius function for the real Cuculemon 1L tumbler (y = 0.35 to 27.8 cm).
 */
export function getBottleRadiusAtY(y) {
  if (y <= TUMBLER_SPECS.barrelTopY) {
    return TUMBLER_SPECS.baseRadius;
  }
  if (y >= TUMBLER_SPECS.shoulderTopY) {
    return TUMBLER_SPECS.neckRadius;
  }
  const t = (y - TUMBLER_SPECS.barrelTopY) / (TUMBLER_SPECS.shoulderTopY - TUMBLER_SPECS.barrelTopY);
  // Smooth convex dome shoulder with clean neck fillet at t -> 1
  const domeCos = Math.cos(Math.pow(t, 1.08) * Math.PI * 0.5);
  const raw = TUMBLER_SPECS.neckRadius + (TUMBLER_SPECS.baseRadius - TUMBLER_SPECS.neckRadius) * Math.pow(Math.max(0, domeCos), 0.72);
  if (t > 0.86) {
    const f = (t - 0.86) / 0.14;
    const smoothF = f * f * (3 - 2 * f);
    return THREE.MathUtils.lerp(raw, TUMBLER_SPECS.neckRadius, smoothF * 0.35);
  }
  return raw;
}

/**
 * Shared exact outer radius function for the crochet sleeve wrapping the 1L Cuculemon bottle.
 */
export function getCaseOuterRadiusAtY(y) {
  if (y <= 1.5) return 4.38;
  if (y <= TUMBLER_SPECS.barrelTopY) return 4.36;
  if (y >= TUMBLER_SPECS.shoulderTopY) return TUMBLER_SPECS.caseNeckOuterRadius;
  return getBottleRadiusAtY(y) + 0.38;
}

/**
 * Generates shared procedural single-crochet V-stitch bump, roughness, and tonal shade maps,
 * plus a ribbed thermal-stitch texture set for flat crochet straps.
 */
export function createCrochetTextureLibrary() {
  const size = 512;
  const cols = 8;
  const rows = 8;
  const cellW = size / cols;
  const cellH = size / rows;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const shadeCanvas = document.createElement('canvas');
  shadeCanvas.width = size;
  shadeCanvas.height = size;
  const sCtx = shadeCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  bCtx.fillStyle = 'rgb(34, 34, 34)';
  bCtx.fillRect(0, 0, size, size);
  sCtx.fillStyle = 'rgb(198, 198, 198)';
  sCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = 'rgb(242, 242, 242)';
  rCtx.fillRect(0, 0, size, size);

  const rng = mulberry32(202611);

  const drawArm = (ctx, x0, y0, x1, y1, width, isBump, isRough) => {
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    if (isBump) {
      grad.addColorStop(0, 'rgb(175, 175, 175)');
      grad.addColorStop(0.45, 'rgb(245, 245, 245)');
      grad.addColorStop(1, 'rgb(145, 145, 145)');
    } else if (isRough) {
      grad.addColorStop(0, 'rgb(212, 212, 212)');
      grad.addColorStop(0.5, 'rgb(194, 194, 194)');
      grad.addColorStop(1, 'rgb(220, 220, 220)');
    } else {
      grad.addColorStop(0, 'rgb(242, 242, 242)');
      grad.addColorStop(0.5, 'rgb(255, 255, 255)');
      grad.addColorStop(1, 'rgb(226, 226, 226)');
    }

    ctx.lineCap = 'round';
    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.strokeStyle = isBump
      ? 'rgba(255,255,255,0.28)'
      : isRough
      ? 'rgba(180,180,180,0.22)'
      : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = Math.max(2, width * 0.28);
    for (let s = 0.2; s <= 0.8; s += 0.3) {
      const mx = x0 + (x1 - x0) * s;
      const my = y0 + (y1 - y0) * s;
      ctx.beginPath();
      ctx.moveTo(mx - width * 0.22, my - width * 0.16);
      ctx.lineTo(mx + width * 0.22, my + width * 0.16);
      ctx.stroke();
    }
  };

  for (let row = 0; row < rows; row++) {
    const rowY = row * cellH;
    const offset = (row % 2) * (cellW * 0.12);

    bCtx.fillStyle = 'rgba(128, 128, 128, 0.45)';
    bCtx.fillRect(0, rowY + 2, size, 7);
    sCtx.fillStyle = 'rgba(222, 222, 222, 0.45)';
    sCtx.fillRect(0, rowY + 2, size, 7);

    for (let col = -1; col <= cols; col++) {
      const cx = col * cellW + cellW * 0.5 + offset;
      const topY = rowY + cellH * 0.16;
      const botY = rowY + cellH * 0.88;
      const armSpread = cellW * 0.29;
      const centerJoin = cellW * 0.08;
      const armW = cellW * 0.26;

      for (const side of [-1, 1]) {
        const xTop = cx + side * armSpread;
        const xBot = cx + side * centerJoin;
        drawArm(bCtx, xTop, topY, xBot, botY, armW, true, false);
        drawArm(sCtx, xTop, topY, xBot, botY, armW, false, false);
        drawArm(rCtx, xTop, topY, xBot, botY, armW, false, true);
      }

      for (let f = 0; f < 10; f++) {
        const fx = cx + (rng() - 0.5) * cellW * 0.85;
        const fy = rowY + rng() * cellH;
        const alpha = 0.08 + rng() * 0.12;
        bCtx.fillStyle = `rgba(255,255,255,${alpha})`;
        bCtx.fillRect(fx, fy, 2.2, 1.4);
        sCtx.fillStyle = `rgba(235,235,235,${alpha})`;
        sCtx.fillRect(fx, fy, 2.2, 1.4);
      }
    }
  }

  const configureTex = (canvas, isSRGB) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  };

  const bumpMap = configureTex(bumpCanvas, false);
  const shadeMap = configureTex(shadeCanvas, true);
  const roughnessMap = configureTex(roughCanvas, false);

  const ribCanvas = document.createElement('canvas');
  ribCanvas.width = 256;
  ribCanvas.height = 256;
  const ribCtx = ribCanvas.getContext('2d');
  ribCtx.fillStyle = 'rgb(48, 48, 48)';
  ribCtx.fillRect(0, 0, 256, 256);

  const ribCount = 12;
  const ribH = 256 / ribCount;
  for (let i = 0; i < ribCount; i++) {
    const y0 = i * ribH;
    const g = ribCtx.createLinearGradient(0, y0, 0, y0 + ribH);
    g.addColorStop(0, 'rgb(52,52,52)');
    g.addColorStop(0.25, 'rgb(218,218,218)');
    g.addColorStop(0.55, 'rgb(248,248,248)');
    g.addColorStop(0.85, 'rgb(160,160,160)');
    g.addColorStop(1, 'rgb(45,45,45)');
    ribCtx.fillStyle = g;
    ribCtx.fillRect(0, y0, 256, ribH);
  }
  ribCtx.strokeStyle = 'rgba(40,40,40,0.45)';
  ribCtx.lineWidth = 3;
  for (let x = 16; x < 256; x += 28) {
    ribCtx.beginPath();
    ribCtx.moveTo(x, 0);
    ribCtx.lineTo(x + 8, 256);
    ribCtx.stroke();
  }
  const ribBumpMap = configureTex(ribCanvas, false);

  return { bumpMap, shadeMap, roughnessMap, ribBumpMap };
}

/**
 * Generates a twisted 3-strand paracord color & bump texture pair.
 */
function createTwistedParacordTextures(colors) {
  const w = 512;
  const h = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w;
  colorCanvas.height = h;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d');

  const strandCount = colors.length;
  const stripeW = w / (strandCount * 2);

  cCtx.fillStyle = colors[0];
  cCtx.fillRect(0, 0, w, h);
  bCtx.fillStyle = 'rgb(80,80,80)';
  bCtx.fillRect(0, 0, w, h);

  for (let i = -4; i < strandCount * 4 + 4; i++) {
    const col = colors[((i % strandCount) + strandCount) % strandCount];
    const xStart = i * stripeW;

    cCtx.fillStyle = col;
    cCtx.beginPath();
    cCtx.moveTo(xStart, 0);
    cCtx.lineTo(xStart + stripeW * 0.92, 0);
    cCtx.lineTo(xStart + stripeW * 0.92 + w * 0.5, h);
    cCtx.lineTo(xStart + w * 0.5, h);
    cCtx.closePath();
    cCtx.fill();

    const bGrad = bCtx.createLinearGradient(xStart, 0, xStart + stripeW, 0);
    bGrad.addColorStop(0, 'rgb(50,50,50)');
    bGrad.addColorStop(0.5, 'rgb(245,245,245)');
    bGrad.addColorStop(1, 'rgb(50,50,50)');
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.moveTo(xStart, 0);
    bCtx.lineTo(xStart + stripeW, 0);
    bCtx.lineTo(xStart + stripeW + w * 0.5, h);
    bCtx.lineTo(xStart + w * 0.5, h);
    bCtx.closePath();
    bCtx.fill();
  }

  cCtx.strokeStyle = 'rgba(0,0,0,0.16)';
  cCtx.lineWidth = 2;
  for (let y = 0; y < h; y += 16) {
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.lineTo(w, y);
    cCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.colorSpace = THREE.NoColorSpace;

  return { map, bumpMap };
}

/**
 * Generates authentic Cuculemon 1L bottle finish: glossy black coat, vertical "CUCULEMON" wordmark,
 * and metallic brushed silver wear flecks along the shoulder edge & lower neck collar transition.
 */
function createCuculemonBottleTextures(profile) {
  const w = 1024;
  const h = 1024;

  const colCanvas = document.createElement('canvas');
  colCanvas.width = w;
  colCanvas.height = h;
  const cCtx = colCanvas.getContext('2d');

  const metCanvas = document.createElement('canvas');
  metCanvas.width = w;
  metCanvas.height = h;
  const mCtx = metCanvas.getContext('2d');

  const rghCanvas = document.createElement('canvas');
  rghCanvas.width = w;
  rghCanvas.height = h;
  const rCtx = rghCanvas.getContext('2d');

  // Compute exact profile arc-length mapping from world Y to UV V coordinate
  const arcLengths = [0];
  let totalLen = 0;
  for (let i = 1; i < profile.length; i++) {
    totalLen += Math.hypot(profile[i].r - profile[i - 1].r, profile[i].y - profile[i - 1].y);
    arcLengths.push(totalLen);
  }
  const yToCanvasPy = (yCm) => {
    for (let i = 1; i < profile.length; i++) {
      const y0 = profile[i - 1].y;
      const y1 = profile[i].y;
      if (yCm <= y1 || i === profile.length - 1) {
        const span = Math.max(1e-5, y1 - y0);
        const f = THREE.MathUtils.clamp((yCm - y0) / span, 0, 1);
        const v = THREE.MathUtils.lerp(arcLengths[i - 1], arcLengths[i], f) / totalLen;
        return (1 - v) * h;
      }
    }
    return 0;
  };

  // Base satin-gloss black coat (calibrated charcoal-black for crisp rim highlight separation)
  cCtx.fillStyle = '#1b1f26';
  cCtx.fillRect(0, 0, w, h);
  mCtx.fillStyle = 'rgb(48,48,48)';
  mCtx.fillRect(0, 0, w, h);
  rCtx.fillStyle = 'rgb(74,74,74)';
  rCtx.fillRect(0, 0, w, h);

  // Subtle metallic wear around dome shoulder (y = 20.6 - 24.4 cm) & neck collar boundary (y = 25.4 - 26.0 cm)
  const rng = mulberry32(9177);
  const paintWearFlake = (px, py, rx, ry, rot, alpha = 1) => {
    cCtx.save();
    cCtx.translate(px, py);
    cCtx.rotate(rot);
    cCtx.fillStyle = `rgba(205, 212, 220, ${alpha})`;
    cCtx.beginPath();
    cCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.restore();

    mCtx.save();
    mCtx.translate(px, py);
    mCtx.rotate(rot);
    mCtx.fillStyle = `rgba(235, 235, 235, ${alpha})`;
    mCtx.beginPath();
    mCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.restore();

    rCtx.save();
    rCtx.translate(px, py);
    rCtx.rotate(rot);
    rCtx.fillStyle = `rgba(56, 56, 56, ${alpha})`;
    rCtx.beginPath();
    rCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.restore();
  };

  // Dome edge metallic silver wear belt (centered ~y = 21.6 - 23.8 cm)
  for (let i = 0; i < 160; i++) {
    const px = rng() * w;
    const yCm = 20.8 + rng() * 2.85;
    const py = yToCanvasPy(yCm);
    const rx = 4 + rng() * 22;
    const ry = 2 + rng() * 7;
    paintWearFlake(px, py, rx, ry, (rng() - 0.5) * 0.45, 0.88);
    if (px + rx > w) paintWearFlake(px - w, py, rx, ry, 0, 0.88);
    if (px - rx < 0) paintWearFlake(px + w, py, rx, ry, 0, 0.88);
  }
  // Thin silver scuff line near top shoulder bend (~y = 23.6 cm) & jagged collar border (y = 25.65-26.0)
  for (let i = 0; i < 65; i++) {
    const px = rng() * w;
    const py = yToCanvasPy(23.5 + (rng() - 0.5) * 0.35);
    paintWearFlake(px, py, 6 + rng() * 14, 1.5 + rng() * 2.8, 0, 0.92);
  }
  for (let i = 0; i < 70; i++) {
    const px = rng() * w;
    const py = yToCanvasPy(25.72 + rng() * 0.28);
    paintWearFlake(px, py, 5 + rng() * 16, 2 + rng() * 5, 0, 0.94);
  }

  // Crisp vertical CUCULEMON wordmark centered toward front (+Z, u = 0.54) from y = 11.8 to 19.6 cm
  const logoCenterX = w * 0.535;
  const logoTopY = yToCanvasPy(19.5);
  const logoBotY = yToCanvasPy(11.6);
  const logoMidY = (logoTopY + logoBotY) * 0.5;

  cCtx.save();
  cCtx.translate(logoCenterX, logoMidY);
  cCtx.rotate(Math.PI / 2);
  cCtx.scale(0.84, 1.0); // Match tall aspect along cylinder circumference
  cCtx.fillStyle = '#dde3e8';
  cCtx.font = '700 44px "Inter", "Segoe UI", Arial, sans-serif';
  cCtx.textAlign = 'center';
  cCtx.textBaseline = 'middle';
  cCtx.fillText('CUCULEMON', 0, 0);
  cCtx.restore();

  rCtx.save();
  rCtx.translate(logoCenterX, logoMidY);
  rCtx.rotate(Math.PI / 2);
  rCtx.scale(0.84, 1.0);
  rCtx.fillStyle = 'rgb(140, 140, 140)';
  rCtx.font = '700 44px "Inter", "Segoe UI", Arial, sans-serif';
  rCtx.textAlign = 'center';
  rCtx.textBaseline = 'middle';
  rCtx.fillText('CUCULEMON', 0, 0);
  rCtx.restore();

  const map = new THREE.CanvasTexture(colCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.wrapS = THREE.RepeatWrapping;

  const metalnessMap = new THREE.CanvasTexture(metCanvas);
  metalnessMap.colorSpace = THREE.NoColorSpace;
  metalnessMap.wrapS = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(rghCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = THREE.RepeatWrapping;

  return { map, metalnessMap, roughnessMap };
}

/**
 * Generates a character-specific cylindrical tapestry-crochet body color texture
 * spanning y = 1.5 to 24.8 cm (unified barrel + curved dome shoulder) for zero material seams.
 * u=0.5 is Front (+Z), u=0/1 is Back (-Z), v=0 is bottom (y=1.5), v=1 is top (y=24.8).
 */
function createCharacterBodyColorMap(characterId, palette, shadeMap, profile) {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = palette.body;
  ctx.fillRect(0, 0, w, h);

  // Match buildSeamlessLatheGeometry arc-length UV parameterization exactly
  const arcLengths = [0];
  let totalLen = 0;
  for (let i = 1; i < profile.length; i++) {
    totalLen += Math.hypot(profile[i].r - profile[i - 1].r, profile[i].y - profile[i - 1].y);
    arcLengths.push(totalLen);
  }
  if (totalLen === 0) totalLen = 1;

  const yCmToPx = (yCm) => {
    if (yCm <= profile[0].y) return h;
    for (let i = 1; i < profile.length; i++) {
      const y0 = profile[i - 1].y;
      const y1 = profile[i].y;
      if (yCm <= y1 || i === profile.length - 1) {
        const span = Math.max(1e-5, y1 - y0);
        const f = THREE.MathUtils.clamp((yCm - y0) / span, 0, 1);
        const v = THREE.MathUtils.lerp(arcLengths[i - 1], arcLengths[i], f) / totalLen;
        return (1 - v) * h;
      }
    }
    return 0;
  };

  if (characterId === 'sceptile') {
    // Continuous Coral Red belly belt (y = 7.2 to 9.8 cm)
    const beltTop = yCmToPx(9.8);
    const beltBot = yCmToPx(7.2);
    ctx.fillStyle = palette.belt;
    ctx.fillRect(0, beltTop, w, beltBot - beltTop);

    ctx.fillStyle = 'rgba(85, 32, 30, 0.24)';
    ctx.fillRect(0, beltTop, w, 4);
    ctx.fillRect(0, beltBot - 4, w, 4);

    // Dark green chest collar band (y = 17.5 to 19.0 cm) with crisp front V-dip at u=0.5
    const bandTopY = yCmToPx(19.0);
    const bandBotY = yCmToPx(17.5);
    const vCenter = w * 0.5;
    const vHalfWidth = w * 0.088;
    const vDip = yCmToPx(16.2) - bandBotY;

    ctx.fillStyle = palette.chestBand;
    ctx.beginPath();
    ctx.moveTo(0, bandTopY);
    ctx.lineTo(vCenter - vHalfWidth, bandTopY);
    ctx.lineTo(vCenter, bandTopY + vDip * 0.78);
    ctx.lineTo(vCenter + vHalfWidth, bandTopY);
    ctx.lineTo(w, bandTopY);
    ctx.lineTo(w, bandBotY);
    ctx.lineTo(vCenter + vHalfWidth, bandBotY);
    ctx.lineTo(vCenter, bandBotY + vDip);
    ctx.lineTo(vCenter - vHalfWidth, bandBotY);
    ctx.lineTo(0, bandBotY);
    ctx.closePath();
    ctx.fill();
  } else if (characterId === 'dragonite') {
    // Unified Cream Belly & Ribbed Throat Panel across front +Z (y = 2.0 to 22.90 cm, seamless over shoulder dome)
    const centerX = w * 0.5;
    const topY = yCmToPx(22.90);
    const botY = yCmToPx(2.0);
    const midY = (topY + botY) * 0.5;
    const radiusX = w * 0.165;
    const radiusY = (botY - topY) * 0.50;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, midY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = palette.bellyCream;
    ctx.fillRect(0, 0, w, h);

    const ribYs = [3.6, 5.2, 6.8, 8.4, 10.0, 11.6, 13.2, 14.8, 16.4, 18.0, 19.6, 21.1, 22.2];
    ctx.fillStyle = palette.bellyRib;
    for (const ry of ribYs) {
      const py = yCmToPx(ry);
      ctx.fillRect(0, py - 4, w, 8);
    }
    ctx.restore();

    ctx.strokeStyle = palette.bellyRib;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(centerX, midY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tileCanvas = shadeMap.image;
  if (tileCanvas) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const repX = 6;
    const repY = 6.6;
    const tw = w / repX;
    const th = h / repY;
    for (let ix = 0; ix < repX; ix++) {
      for (let iy = 0; iy < Math.ceil(repY); iy++) {
        ctx.drawImage(tileCanvas, ix * tw, iy * th, tw, th);
      }
    }
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a Lathe-style surface geometry from `[{ r, y }]` profile points
 * with guaranteed UV mapping:
 *   u = 0.0 -> Back (-Z), u = 0.25 -> Left (-X), u = 0.5 -> Front (+Z), u = 0.75 -> Right (+X), u = 1.0 -> Back (-Z).
 */
function buildSeamlessLatheGeometry(profile, radialSegments = 64, flipWinding = false) {
  const segCount = radialSegments;
  const arcLengths = [0];
  let totalLen = 0;
  for (let i = 1; i < profile.length; i++) {
    const dr = profile[i].r - profile[i - 1].r;
    const dy = profile[i].y - profile[i - 1].y;
    totalLen += Math.hypot(dr, dy);
    arcLengths.push(totalLen);
  }
  if (totalLen === 0) totalLen = 1;

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j < profile.length; j++) {
    const { r, y } = profile[j];
    const v = arcLengths[j] / totalLen;
    for (let i = 0; i <= segCount; i++) {
      const u = i / segCount;
      const theta = Math.PI + u * Math.PI * 2;
      const x = r * Math.sin(theta);
      const z = r * Math.cos(theta);
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const rowStride = segCount + 1;
  for (let j = 0; j < profile.length - 1; j++) {
    for (let i = 0; i < segCount; i++) {
      const a = j * rowStride + i;
      const b = a + 1;
      const c = (j + 1) * rowStride + i;
      const d = c + 1;
      if (!flipWinding) {
        indices.push(a, b, d);
        indices.push(a, d, c);
      } else {
        indices.push(a, d, b);
        indices.push(a, c, d);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function createYarnMaterial(colorHex, texLib, repeatX = 4, repeatY = 4, customColorMap = null) {
  const bump = texLib.bumpMap.clone();
  bump.repeat.set(repeatX, repeatY);
  bump.needsUpdate = true;

  const rough = texLib.roughnessMap.clone();
  rough.repeat.set(repeatX, repeatY);
  rough.needsUpdate = true;

  let map = customColorMap;
  if (!map) {
    map = texLib.shadeMap.clone();
    map.repeat.set(repeatX, repeatY);
    map.needsUpdate = true;
  }

  const baseColor = new THREE.Color(customColorMap ? '#ffffff' : colorHex);
  const sheenColor = new THREE.Color(colorHex).lerp(new THREE.Color('#ffffff'), 0.32);

  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    map,
    bumpMap: bump,
    bumpScale: 0.16,
    roughnessMap: rough,
    roughness: 0.88,
    metalness: 0.02,
    sheen: 0.34,
    sheenRoughness: 0.82,
    sheenColor,
    clearcoat: 0.0
  });
}

function createMetalMaterial(colorHex = '#9aa5b2', roughness = 0.24) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.90,
    roughness
  });
}

function configureShadowMesh(object3d, partName) {
  object3d.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (partName) child.userData.partName = partName;
    }
  });
  return object3d;
}

/**
 * Builds the authentic 1:1 cm 1L Cuculemon Stainless Steel Tumbler (y = 0.35 to 32.0 cm):
 * - y = 0.35 - 21.5 cm: Glossy black straight cylinder (Ø 8.0 cm) + vertical CUCULEMON text
 * - y = 21.5 - 24.8 cm: Rounded convex dome shoulder with subtle metallic silver wear edge
 * - y = 24.8 - 27.8 cm: Vertical cylindrical neck (Ø 5.7 cm) -> brushed steel collar (26.0 - 27.8 cm)
 * - y = 27.8 - 32.0 cm: Smooth matte-black screw cap + top flip-straw nozzle + side teardrop carry loop
 */
export function buildTumbler1L() {
  const group = new THREE.Group();
  group.name = 'tumbler-1l';

  const bodyProfile = [
    { r: 0.0, y: 0.35 },
    { r: 3.55, y: 0.35 },
    { r: 3.92, y: 0.55 },
    { r: 4.00, y: 0.92 },
    { r: 4.00, y: 21.5 }
  ];
  for (let s = 1; s <= 10; s++) {
    const y = 21.5 + (s / 10) * (TUMBLER_SPECS.shoulderTopY - 21.5);
    bodyProfile.push({ r: getBottleRadiusAtY(y), y });
  }
  bodyProfile.push({ r: TUMBLER_SPECS.neckRadius, y: 26.02 });

  const bottleTex = createCuculemonBottleTextures(bodyProfile);
  const bodyGeom = buildSeamlessLatheGeometry(bodyProfile, 64);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: bottleTex.map,
    metalnessMap: bottleTex.metalnessMap,
    metalness: 0.95,
    roughnessMap: bottleTex.roughnessMap,
    roughness: 0.95
  });
  const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
  bodyMesh.name = 'bottle-body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Exposed brushed stainless neck collar (y = 26.0 to 27.8 cm, Ø 5.7 cm)
  const neckProfile = [
    { r: TUMBLER_SPECS.neckRadius, y: 26.0 },
    { r: TUMBLER_SPECS.neckRadius, y: 27.8 },
    { r: 2.66, y: 27.8 }
  ];
  const neckGeom = buildSeamlessLatheGeometry(neckProfile, 56);
  const neckMat = new THREE.MeshStandardMaterial({
    color: '#d4dce4',
    metalness: 0.92,
    roughness: 0.21
  });
  const neckMesh = new THREE.Mesh(neckGeom, neckMat);
  neckMesh.name = 'bottle-neck';
  neckMesh.castShadow = true;
  group.add(neckMesh);

  // Smooth matte-black screw cap + flip-straw nozzle + side-hinged teardrop carry handle
  const capGroup = new THREE.Group();
  capGroup.name = 'bottle-cap';
  const capMat = new THREE.MeshStandardMaterial({
    color: '#16181c',
    metalness: 0.08,
    roughness: 0.44
  });

  const capProfile = [
    { r: 2.75, y: 27.80 },
    { r: 2.95, y: 27.84 },
    { r: 2.95, y: 30.15 },
    { r: 2.82, y: 30.40 },
    { r: 2.48, y: 30.40 },
    { r: 2.38, y: 30.18 }, // subtle top recess pocket
    { r: 0.0, y: 30.18 }
  ];
  const capMesh = new THREE.Mesh(buildSeamlessLatheGeometry(capProfile, 56), capMat);
  capMesh.castShadow = true;
  capGroup.add(capMesh);

  // Top flat flip-straw channel cover bar & hinged spout nozzle + angled thumb flip tab (reaching y = 32.0 cm)
  const strawChannel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.48, 3.65), capMat);
  strawChannel.position.set(0, 30.36, 0.25);
  capGroup.add(strawChannel);

  const plugDome = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.55, 20), capMat);
  plugDome.position.set(0, 30.58, 1.35);
  capGroup.add(plugDome);

  const flipSpout = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.15, 0.28), capMat);
  flipSpout.position.set(0, 31.18, 0.12);
  flipSpout.rotation.x = 0.42;
  flipSpout.castShadow = true;
  capGroup.add(flipSpout);

  const spoutTip = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.55, 14), capMat);
  spoutTip.position.set(0, 31.68, -0.15);
  spoutTip.rotation.x = 0.42;
  capGroup.add(spoutTip);

  // Hinged Side Carry Loop Assembly rotated cleanly toward back-right (130° from +Z)
  // Clears left/right strap clasps (±90°) and rear drawstring lock (180°) while staying clearly visible
  const handlePivot = new THREE.Group();
  handlePivot.rotation.y = Math.PI * 0.72;

  const hingeLug = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.05, 1.48), capMat);
  hingeLug.position.set(0, 30.08, 3.22);
  hingeLug.castShadow = true;
  handlePivot.add(hingeLug);

  const pinMat = createMetalMaterial('#c4ccd4', 0.22);
  const hingePin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.92, 12), pinMat);
  hingePin.rotation.z = Math.PI / 2;
  hingePin.position.set(0, 30.15, 3.55);
  handlePivot.add(hingePin);

  // Thick molded teardrop carry loop hanging gracefully down outside the neck & Silicone Ring (clearance r >= 3.82 cm)
  const teardropPts = [
    new THREE.Vector3(-0.78, 30.12, 3.58),
    new THREE.Vector3(-1.32, 28.45, 3.92),
    new THREE.Vector3(-1.42, 26.20, 4.02),
    new THREE.Vector3(-1.12, 24.85, 3.88),
    new THREE.Vector3(0.0, 24.68, 3.82),
    new THREE.Vector3(1.12, 24.85, 3.88),
    new THREE.Vector3(1.42, 26.20, 4.02),
    new THREE.Vector3(1.32, 28.45, 3.92),
    new THREE.Vector3(0.78, 30.12, 3.58)
  ];
  const teardropCurve = new THREE.CatmullRomCurve3(teardropPts, true);
  const loopGeom = buildFlatRibbonAlongCurve(teardropCurve, 0.56, 0.34, 72);
  const loopMesh = new THREE.Mesh(loopGeom, capMat);
  loopMesh.castShadow = true;
  handlePivot.add(loopMesh);

  capGroup.add(handlePivot);
  group.add(capGroup);

  // Subtle X-Ray wireframe silhouette shell
  const xrayWireMat = new THREE.MeshBasicMaterial({
    color: '#6ec8f5',
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });
  const xrayShell = new THREE.Mesh(bodyGeom, xrayWireMat);
  xrayShell.visible = false;
  xrayShell.name = 'bottle-xray-wire';
  group.add(xrayShell);

  const bottleMaterials = [bodyMat, neckMat, capMat];

  function setXRay(enabled) {
    xrayShell.visible = enabled;
    for (const mat of bottleMaterials) {
      mat.transparent = enabled;
      mat.opacity = enabled ? 0.34 : 1.0;
      mat.depthWrite = !enabled;
      if (mat === bodyMat) {
        mat.emissive.set(enabled ? '#1f7ca8' : '#000000');
        mat.emissiveIntensity = enabled ? 0.42 : 0;
      }
      mat.needsUpdate = true;
    }
  }

  return { group, setXRay };
}

/**
 * Builds the 4-part tight crochet shell wrapping the real Cuculemon 1L bottle (y = 0.0 to 27.95 cm).
 */
function buildCaseShell(characterId, palette, texLib) {
  const shellGroup = new THREE.Group();
  shellGroup.name = `${characterId}-shell`;

  // 1. Reinforced Base (0.0 to 1.5 cm)
  const baseGroup = new THREE.Group();
  const baseProfile = [
    { r: 0.0, y: 0.0 },
    { r: 4.18, y: 0.0 },
    { r: 4.38, y: 0.25 },
    { r: 4.38, y: 1.42 },
    { r: 4.44, y: 1.47 },
    { r: 4.36, y: 1.50 }
  ];
  const baseMat = createYarnMaterial(palette.anchorDark || palette.base, texLib, 6, 1.2);
  const baseMesh = new THREE.Mesh(buildSeamlessLatheGeometry(baseProfile, 64), baseMat);
  baseGroup.add(baseMesh);

  // Internal EVA Foam Disc (4 mm, visible in X-Ray mode)
  const evaMat = new THREE.MeshStandardMaterial({
    color: '#202833',
    roughness: 0.85,
    metalness: 0.05,
    emissive: '#142636',
    emissiveIntensity: 0.3
  });
  const evaDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.85, 0.38, 48), evaMat);
  evaDisc.position.y = 0.42;
  evaDisc.name = 'eva-foam-disc';
  baseGroup.add(evaDisc);

  configureShadowMesh(baseGroup, 'Reinforced Base & EVA Foam (0–1.5 cm)');
  shellGroup.add(baseGroup);

  // 2. Unified Barrel + Convex Dome Shoulder Sleeve (1.50 to 24.80 cm) for 100% seamless pattern & Dragonite throat
  const mainProfile = [{ r: 4.36, y: 1.50 }];
  for (let s = 0; s <= 14; s++) {
    const y = TUMBLER_SPECS.barrelTopY + (s / 14) * (TUMBLER_SPECS.shoulderTopY - TUMBLER_SPECS.barrelTopY);
    mainProfile.push({ r: getCaseOuterRadiusAtY(y), y });
  }
  const bodyColorTex = createCharacterBodyColorMap(characterId, palette, texLib.shadeMap, mainProfile);
  const bodyMat = createYarnMaterial('#ffffff', texLib, 6, 6.6, bodyColorTex);
  const bodyMesh = new THREE.Mesh(buildSeamlessLatheGeometry(mainProfile, 64), bodyMat);
  configureShadowMesh(bodyMesh, 'Main Crochet Body & Dome Shoulder Sleeve (1.5–24.8 cm)');
  shellGroup.add(bodyMesh);

  // 3. Vertical Neck Collar Cuff (24.8 to 27.95 cm) with recessed drawstring groove at y = 25.80 cm
  const collarProfile = [
    { r: 3.24, y: 24.80 },
    { r: 3.28, y: 25.35 },
    { r: 3.16, y: 25.60 },
    { r: 3.12, y: 25.80 }, // subtle recessed eyelet groove around y = 25.80 cm
    { r: 3.16, y: 26.02 },
    { r: 3.28, y: 26.30 },
    { r: 3.26, y: 26.68 },
    { r: 3.20, y: 26.80 }, // seats cleanly into Silicone Neck Ring (26.78 - 27.63 cm)
    { r: 3.18, y: 27.65 },
    { r: 3.25, y: 27.92 }, // top rolled crochet lip above Silicone Ring
    { r: 3.04, y: 28.00 },
    { r: 2.89, y: 27.90 }, // hugs Ø 5.7 cm vertical neck tightly
    { r: 2.89, y: 24.80 }
  ];
  const collarMat = createYarnMaterial(palette.body, texLib, 5.2, 1.15);
  const collarMesh = new THREE.Mesh(buildSeamlessLatheGeometry(collarProfile, 64), collarMat);
  configureShadowMesh(collarMesh, 'Vertical Neck Collar Cuff (24.8–28.0 cm)');
  shellGroup.add(collarMesh);

  return {
    shellGroup,
    sleeveMeshes: [baseMesh, bodyMesh, collarMesh],
    evaDisc
  };
}

/**
 * Builds a single Metal Swivel Lobster Clasp (1.5 cm inner eye width) positioned so
 * its hook latch sits centered at (0, 0, 0) and its strap-eye bar sits at (0, +2.02, 0).
 */
function buildSwivelClasp(metalMat) {
  const clasp = new THREE.Group();

  // Bottom C-hook latching directly onto molded Silicone Side Ear Loop
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.72, 0.14),
    new THREE.Vector3(0, 0.42, 0.42),
    new THREE.Vector3(0, 0.0, 0.34),
    new THREE.Vector3(0, -0.14, 0.0),
    new THREE.Vector3(0, 0.04, -0.34),
    new THREE.Vector3(0, 0.48, -0.32),
    new THREE.Vector3(0, 0.78, -0.04)
  ]);
  clasp.add(new THREE.Mesh(new THREE.TubeGeometry(hookCurve, 24, 0.12, 10, false), metalMat));

  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.24), metalMat);
  trigger.position.set(0, 0.56, 0.48);
  trigger.rotation.x = -0.35;
  clasp.add(trigger);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.48, 16), metalMat);
  barrel.position.set(0, 1.02, 0);
  clasp.add(barrel);

  const loopProfile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.24, -0.82),
    new THREE.Vector3(0, 1.98, -0.82),
    new THREE.Vector3(0, 2.04, 0),
    new THREE.Vector3(0, 1.98, 0.82),
    new THREE.Vector3(0, 1.24, 0.82),
    new THREE.Vector3(0, 1.24, -0.82)
  ]);
  clasp.add(new THREE.Mesh(new THREE.TubeGeometry(loopProfile, 28, 0.11, 10, false), metalMat));

  return clasp;
}

/**
 * Builds the Revised Neck Collar Hanger System (NO vertical webbing, NO metal D-rings):
 * 1. Wide-Mouth Matte-Black Silicone Tumbler Neck Ring (y = 26.78 - 27.63 cm) with 2 molded Side Ear Loops (-X & +X)
 * 2. 4 prominent Polycherry yarn tacking stitch bundles anchoring the Silicone Ring into the crochet collar
 * 3. Visibly Woven-In Paracord Drawstring (y = 25.80 cm) passing IN and OUT through 14 dark eyelets & raised crochet stitch bridges,
 *    exiting rear (-Z) through a 2-hole spring cord lock & character cord-end beads.
 */
function buildHangerSystem(characterId, palette, texLib) {
  const group = new THREE.Group();
  group.name = `${characterId}-hanger-system`;

  const paracordTex = createTwistedParacordTextures(palette.strapColors);
  paracordTex.map.repeat.set(11, 1);
  paracordTex.bumpMap.repeat.set(11, 1);

  const cordMat = new THREE.MeshPhysicalMaterial({
    map: paracordTex.map,
    bumpMap: paracordTex.bumpMap,
    bumpScale: 0.12,
    roughness: 0.62,
    metalness: 0.04,
    sheen: 0.22
  });

  // --- A. Wide-Mouth Matte-Black Silicone Neck Ring (y = 26.78 - 27.63 cm, ~0.85 cm tall, ~0.38 cm wall) ---
  const siliconeMat = new THREE.MeshPhysicalMaterial({
    color: '#191c22',
    roughness: 0.66,
    metalness: 0.04,
    clearcoat: 0.08,
    clearcoatRoughness: 0.72
  });

  const ringProfile = [
    new THREE.Vector2(3.18, 26.82),
    new THREE.Vector2(3.26, 26.76),
    new THREE.Vector2(3.52, 26.76),
    new THREE.Vector2(3.58, 26.86),
    new THREE.Vector2(3.58, 27.53),
    new THREE.Vector2(3.52, 27.63),
    new THREE.Vector2(3.26, 27.63),
    new THREE.Vector2(3.18, 27.57),
    new THREE.Vector2(3.18, 26.82)
  ];
  const siliconeRingGeom = new THREE.LatheGeometry(ringProfile, 64);
  const siliconeRing = new THREE.Mesh(siliconeRingGeom, siliconeMat);
  siliconeRing.name = 'silicone-neck-ring';
  group.add(siliconeRing);

  // Subtle molded relief ridges along top/bottom rim of Silicone Ring
  for (const rimY of [26.85, 27.54]) {
    const rimBead = new THREE.Mesh(new THREE.TorusGeometry(3.56, 0.045, 8, 64), siliconeMat);
    rimBead.rotation.x = Math.PI / 2;
    rimBead.position.y = rimY;
    group.add(rimBead);
  }

  // 2 Molded Silicone Side Ear Loops (-X & +X) integrated into the ring
  const earMountPoints = [];
  for (const side of [-1, 1]) {
    // Sturdy molded silicone shoulder gusset fusing ear into ring wall
    const gusset = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.88, 1.05), siliconeMat);
    gusset.position.set(side * 3.55, 27.20, 0);
    group.add(gusset);

    // Molded rounded silicone ear loop (lubang kuping silikon)
    const earPts = [
      new THREE.Vector3(side * 3.55, 27.56, 0),
      new THREE.Vector3(side * 4.02, 27.64, 0),
      new THREE.Vector3(side * 4.38, 27.46, 0),
      new THREE.Vector3(side * 4.44, 27.20, 0),
      new THREE.Vector3(side * 4.38, 26.94, 0),
      new THREE.Vector3(side * 4.02, 26.76, 0),
      new THREE.Vector3(side * 3.55, 26.84, 0)
    ];
    const earCurve = new THREE.CatmullRomCurve3(earPts);
    const earMesh = new THREE.Mesh(new THREE.TubeGeometry(earCurve, 24, 0.19, 12, false), siliconeMat);
    group.add(earMesh);

    // Clasp hooks directly onto outer bar of the silicone ear loop at (±4.38, 27.20, 0)
    earMountPoints.push(new THREE.Vector3(side * 4.38, 27.20, 0));
  }

  // 4 Visible Polycherry Yarn Tacking Stitch Loops (Front +Z, Back -Z, Left -X, Right +X)
  // Physically wrapping over lower Silicone Ring rim and locking into upper crochet collar (y = 26.42 - 27.32)
  const tackMat = createYarnMaterial(palette.tackColor || palette.base, texLib, 2, 2);
  const tackAccentMat = createYarnMaterial(palette.anchorDark || palette.cuffColor, texLib, 2, 2);
  const cardinals = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]; // +Z, +X, -Z, -X

  for (const baseAng of cardinals) {
    // 3 tight whip-stitch loops per cardinal tack point so crocheter sees exact binding path
    for (const dAng of [-0.075, 0, 0.075]) {
      const a = baseAng + dAng;
      const sx = Math.sin(a);
      const sz = Math.cos(a);
      const loopCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx * 3.22, 26.42, sz * 3.22), // anchored into crochet collar row
        new THREE.Vector3(sx * 3.63, 26.72, sz * 3.63), // wraps outside bottom edge of Silicone Ring
        new THREE.Vector3(sx * 3.64, 27.22, sz * 3.64), // hugs mid Silicone Ring wall
        new THREE.Vector3(sx * 3.42, 27.68, sz * 3.42), // passes over upper rim
        new THREE.Vector3(sx * 3.20, 27.76, sz * 3.20)  // locks into upper crochet cuff
      ]);
      const loopMesh = new THREE.Mesh(
        new THREE.TubeGeometry(loopCurve, 18, 0.085, 8, false),
        dAng === 0 ? tackAccentMat : tackMat
      );
      group.add(loopMesh);
    }
  }

  // --- B. Visibly Connected Woven-In Drawstring (y = 25.80 cm) ---
  const yDraw = TUMBLER_SPECS.drawstringY;
  const numEyelets = 14;
  const stepAng = (Math.PI * 2) / numEyelets;
  // Offset angles so eyelets 0 and 13 cleanly straddle Rear (-Z, theta = PI) symmetrically
  const startTheta = Math.PI + stepAng * 0.5;

  const eyeletHoleMat = new THREE.MeshStandardMaterial({ color: '#0d1014', roughness: 0.9 });
  const eyeletRimMat = createYarnMaterial(palette.anchorDark || palette.base, texLib, 2, 2);
  const bridgeMat = createYarnMaterial(palette.body, texLib, 3, 1.5);

  for (let k = 0; k < numEyelets; k++) {
    const a = startTheta + k * stepAng;
    const nx = Math.sin(a);
    const nz = Math.cos(a);

    // Recessed dark eyelet cavity + proud crochet grommet ring at r = 3.21 cm so all 14 openings read clearly
    const eyeletHolder = new THREE.Group();
    eyeletHolder.position.set(nx * 3.21, yDraw, nz * 3.21);
    eyeletHolder.rotation.y = a;

    const cavity = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 14), eyeletHoleMat);
    cavity.rotation.x = Math.PI / 2;
    eyeletHolder.add(cavity);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.072, 10, 18), eyeletRimMat);
    rim.position.z = 0.04;
    eyeletHolder.add(rim);

    group.add(eyeletHolder);

    // On every ODD span between eyelets (except the open rear gap k=13 -> k=0), add a raised
    // crochet stitch bridge loop that clearly arches OVER the tucked paracord!
    if (k < numEyelets - 1 && k % 2 === 1) {
      const a0 = a + 0.03;
      const a1 = a + stepAng - 0.03;
      const am = (a0 + a1) * 0.5;
      const bridgeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.sin(a0) * 3.21, yDraw, Math.cos(a0) * 3.21),
        new THREE.Vector3(Math.sin(am) * 3.46, yDraw + 0.04, Math.cos(am) * 3.46),
        new THREE.Vector3(Math.sin(a1) * 3.21, yDraw, Math.cos(a1) * 3.21)
      ]);
      const bridge = new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 10, 0.20, 8, false), bridgeMat);
      group.add(bridge);
    }
  }

  // Continuous woven paracord passing OUT on even spans & IN behind stitch bridges on odd spans
  // Starts cleanly at Rear-Left eyelet (k=0, a = PI + stepAng/2) -> wraps around front -> exits Rear-Right eyelet (k=13, a = 3PI - stepAng/2)
  const weavePts = [];
  const totalSamples = 140;
  for (let i = 0; i <= totalSamples; i++) {
    const f = i / totalSamples;
    const spanF = f * (numEyelets - 1); // 0 to 13 across 13 connected spans (skipping rear exit gap)
    const spanIdx = Math.min(numEyelets - 2, Math.floor(spanF));
    const localT = spanF - spanIdx;
    const theta = startTheta + spanF * stepAng;

    // Passes OUT (r = 3.43) on even spans, IN (r = 3.02) behind stitch bridges on odd spans
    const isOuterSpan = spanIdx % 2 === 0;
    const archFactor = Math.sin(localT * Math.PI); // 0 at eyelet center, 1 at mid-span
    const r = isOuterSpan
      ? 3.18 + 0.25 * archFactor
      : 3.18 - 0.16 * archFactor;

    weavePts.push(new THREE.Vector3(Math.sin(theta) * r, yDraw, Math.cos(theta) * r));
  }
  const weaveCurve = new THREE.CatmullRomCurve3(weavePts);
  const weaveMesh = new THREE.Mesh(new THREE.TubeGeometry(weaveCurve, 150, 0.18, 10, false), cordMat);
  group.add(weaveMesh);

  // Two paracord tails emerging cleanly out of rear eyelets (theta = PI ± stepAng/2) into 2-hole Spring Cord Lock
  const lockMat = new THREE.MeshStandardMaterial({ color: '#1b1e24', roughness: 0.44, metalness: 0.12 });
  const cordLock = new THREE.Group();
  cordLock.position.set(0, 24.95, -4.05);
  cordLock.rotation.x = 0.22;
  const lockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.66, 1.32, 18), lockMat);
  lockBody.scale.set(1.35, 1, 0.85);
  cordLock.add(lockBody);
  const lockPlunger = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.52, 16), lockMat);
  lockPlunger.position.y = 0.80;
  cordLock.add(lockPlunger);
  group.add(cordLock);

  const beadMat = createYarnMaterial(palette.cordEndColor, texLib, 2, 2);
  const exitOffsetAng = stepAng * 0.5;
  for (const side of [-1, 1]) {
    const exitAng = Math.PI - side * exitOffsetAng; // left/right adjacent to -Z
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.sin(exitAng) * 3.16, yDraw, Math.cos(exitAng) * 3.16), // inside eyelet
      new THREE.Vector3(Math.sin(exitAng) * 3.55, yDraw - 0.18, Math.cos(exitAng) * 3.55),
      new THREE.Vector3(side * 0.30, 25.15, -4.02), // passes through cord lock
      new THREE.Vector3(side * 0.34, 24.05, -4.32),
      new THREE.Vector3(side * 0.42, 22.95, -4.48)
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 22, 0.175, 10, false), cordMat));

    const endBead = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), beadMat);
    endBead.scale.set(0.9, 1.15, 0.9);
    endBead.position.set(side * 0.42, 22.76, -4.50);
    group.add(endBead);
  }

  configureShadowMesh(group, 'Silicone Neck Ring & Woven Eyelet Drawstring');
  return { group, earMountPoints };
}

/**
 * Sweeps a rounded-rectangle cross section along a CatmullRomCurve3 using stable parallel-transport frames.
 */
function buildFlatRibbonAlongCurve(curve, width = 2.0, thickness = 0.5, segments = 120) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pts = curve.getSpacedPoints(segments);

  const ringPts = 14;
  const localProfile = [];
  const hw = width * 0.5;
  const ht = thickness * 0.5;
  for (let k = 0; k < ringPts; k++) {
    const a = (k / ringPts) * Math.PI * 2;
    const cx = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.55) * ht;
    const cz = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.55) * hw;
    localProfile.push([cx, cz]);
  }

  const positions = [];
  const uvs = [];
  const indices = [];
  const len = curve.getLength();

  let prevTangent = pts[1].clone().sub(pts[0]).normalize();
  let normal = new THREE.Vector3(0, 0, 1);
  if (Math.abs(prevTangent.dot(normal)) > 0.9) {
    normal.set(1, 0, 0);
  }
  let binormal = new THREE.Vector3().crossVectors(prevTangent, normal).normalize();
  normal = new THREE.Vector3().crossVectors(binormal, prevTangent).normalize();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pos = pts[i];
    const tangent = frames.tangents[i];

    const rotAxis = new THREE.Vector3().crossVectors(prevTangent, tangent);
    if (rotAxis.lengthSq() > 1e-8) {
      rotAxis.normalize();
      const angle = Math.acos(THREE.MathUtils.clamp(prevTangent.dot(tangent), -1, 1));
      normal.applyAxisAngle(rotAxis, angle);
      binormal.applyAxisAngle(rotAxis, angle);
    }
    prevTangent = tangent.clone();

    for (let k = 0; k <= ringPts; k++) {
      const [lx, lz] = localProfile[k % ringPts];
      const vx = pos.x + normal.x * lx + binormal.x * lz;
      const vy = pos.y + normal.y * lx + binormal.y * lz;
      const vz = pos.z + normal.z * lx + binormal.z * lz;
      positions.push(vx, vy, vz);
      uvs.push(k / ringPts, t * (len / 2.2));
    }
  }

  const stride = ringPts + 1;
  for (let i = 0; i < segments; i++) {
    for (let k = 0; k < ringPts; k++) {
      const a = i * stride + k;
      const b = a + 1;
      const c = (i + 1) * stride + k;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function calibrateCurveToLength(buildCurveFn, minParam, maxParam, targetCm) {
  let lo = minParam;
  let hi = maxParam;
  let bestCurve = buildCurveFn((lo + hi) * 0.5);
  for (let iter = 0; iter < 14; iter++) {
    const mid = (lo + hi) * 0.5;
    const candidate = buildCurveFn(mid);
    bestCurve = candidate;
    const len = candidate.getLength();
    if (Math.abs(len - targetCm) < 0.08) break;
    if (len < targetCm) lo = mid;
    else hi = mid;
  }
  return bestCurve;
}

/**
 * Builds Interchangeable Straps hooking DIRECTLY onto the 2 molded Silicone Side Ear Loops:
 *  - Short Strap (30 cm twisted 3-color paracord arch + crochet cuffs + swivel clasps)
 *  - Long Strap (100 cm flat Thermal Stitch crochet sling + paracord tips + swivel clasps)
 */
function buildInterchangeableStraps(characterId, palette, texLib, earMountPoints) {
  const [leftMount, rightMount] = earMountPoints;
  const metalMat = createMetalMaterial('#a4aeb8', 0.20);

  const leftEye = new THREE.Vector3(leftMount.x, leftMount.y + 1.98, leftMount.z);
  const rightEye = new THREE.Vector3(rightMount.x, rightMount.y + 1.98, rightMount.z);

  // --- A. SHORT STRAP (30 cm) ---
  const shortGroup = new THREE.Group();
  shortGroup.name = `${characterId}-strap-short`;

  const shortCurve = calibrateCurveToLength(
    (lift) =>
      new THREE.CatmullRomCurve3([
        leftEye.clone(),
        new THREE.Vector3(leftEye.x - 0.55, leftEye.y + lift * 0.48, 0),
        new THREE.Vector3(-3.0, leftEye.y + lift * 0.88, 0),
        new THREE.Vector3(0, leftEye.y + lift, 0),
        new THREE.Vector3(3.0, rightEye.y + lift * 0.88, 0),
        new THREE.Vector3(rightEye.x + 0.55, rightEye.y + lift * 0.48, 0),
        rightEye.clone()
      ]),
    6.5,
    17.5,
    TUMBLER_SPECS.shortStrapLengthCm
  );

  const shortCordTex = createTwistedParacordTextures(palette.strapColors);
  shortCordTex.map.repeat.set(22, 1);
  shortCordTex.bumpMap.repeat.set(22, 1);
  const shortRopeMat = new THREE.MeshPhysicalMaterial({
    map: shortCordTex.map,
    bumpMap: shortCordTex.bumpMap,
    bumpScale: 0.14,
    roughness: 0.62,
    metalness: 0.04,
    sheen: 0.25
  });

  shortGroup.add(new THREE.Mesh(new THREE.TubeGeometry(shortCurve, 96, 0.52, 14, false), shortRopeMat));

  const cuffMat = createYarnMaterial(palette.cuffColor, texLib, 2.5, 2);
  const addEndCuff = (tStart, tEnd) => {
    const subPts = [];
    for (let s = 0; s <= 12; s++) {
      subPts.push(shortCurve.getPointAt(tStart + (s / 12) * (tEnd - tStart)));
    }
    const subCurve = new THREE.CatmullRomCurve3(subPts);
    shortGroup.add(new THREE.Mesh(new THREE.TubeGeometry(subCurve, 16, 0.66, 14, false), cuffMat));
  };
  addEndCuff(0.0, 0.115);
  addEndCuff(0.885, 1.0);

  for (const mp of [leftMount, rightMount]) {
    const clasp = buildSwivelClasp(metalMat);
    clasp.position.copy(mp);
    shortGroup.add(clasp);
  }

  shortGroup.userData.measuredLengthCm = Number(shortCurve.getLength().toFixed(1));
  configureShadowMesh(shortGroup, `Short Strap (${shortGroup.userData.measuredLengthCm} cm)`);

  // --- B. LONG STRAP (100 cm Crossbody Thermal Stitch Sling) ---
  const longGroup = new THREE.Group();
  longGroup.name = `${characterId}-strap-long`;

  const leftSlingEye = new THREE.Vector3(leftMount.x - 0.55, leftMount.y + 1.70, 0.85);
  const rightSlingEye = new THREE.Vector3(rightMount.x + 0.55, rightMount.y + 1.70, 0.85);

  const longCurve = calibrateCurveToLength(
    (k) =>
      new THREE.CatmullRomCurve3([
        leftSlingEye.clone(),
        new THREE.Vector3(-6.6 * k, 29.8, 2.0 * k),
        new THREE.Vector3(-12.2 * k, 18.5, 5.2 * k),
        new THREE.Vector3(-13.8 * k, 2.8, 10.6 * k),
        new THREE.Vector3(-7.6 * k, 0.72, 15.2 * k),
        new THREE.Vector3(0, 0.64, 16.5 * k),
        new THREE.Vector3(7.6 * k, 0.72, 15.0 * k),
        new THREE.Vector3(13.8 * k, 2.8, 10.2 * k),
        new THREE.Vector3(12.0 * k, 18.2, 4.8 * k),
        new THREE.Vector3(6.6 * k, 29.6, 1.8 * k),
        rightSlingEye.clone()
      ]),
    0.7,
    1.6,
    TUMBLER_SPECS.longStrapLengthCm
  );

  const longBump = texLib.ribBumpMap.clone();
  longBump.repeat.set(1, 0.45);
  longBump.needsUpdate = true;

  const longStrapMat = new THREE.MeshPhysicalMaterial({
    color: palette.anchorDark || palette.base,
    bumpMap: longBump,
    bumpScale: 0.16,
    roughness: 0.86,
    metalness: 0.02,
    sheen: 0.35,
    sheenColor: new THREE.Color(palette.body).lerp(new THREE.Color('#ffffff'), 0.25)
  });

  longGroup.add(new THREE.Mesh(buildFlatRibbonAlongCurve(longCurve, 2.0, 0.52, 180), longStrapMat));

  const tipCordTex = createTwistedParacordTextures(palette.strapColors);
  tipCordTex.map.repeat.set(4, 1);
  const tipCordMat = new THREE.MeshStandardMaterial({ map: tipCordTex.map, roughness: 0.65 });

  for (const [mp, eye, side] of [
    [leftMount, leftSlingEye, -1],
    [rightMount, rightSlingEye, 1]
  ]) {
    const clasp = buildSwivelClasp(metalMat);
    clasp.position.copy(mp);
    clasp.rotation.z = side * 0.26;
    clasp.rotation.x = 0.40;
    longGroup.add(clasp);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.56, 2.4, 14), cuffMat);
    cuff.position.copy(eye).add(new THREE.Vector3(side * 0.55, 0.4, 0.55));
    cuff.rotation.z = side * 0.65;
    cuff.rotation.x = 0.5;
    longGroup.add(cuff);

    const innerCord = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.3, 12), tipCordMat);
    innerCord.position.copy(eye).add(new THREE.Vector3(side * 0.18, 0.05, 0.18));
    innerCord.rotation.z = side * 0.45;
    innerCord.rotation.x = 0.45;
    longGroup.add(innerCord);
  }

  longGroup.userData.measuredLengthCm = Number(longCurve.getLength().toFixed(1));
  configureShadowMesh(longGroup, `Long Crossbody Strap (${longGroup.userData.measuredLengthCm} cm)`);

  return { shortGroup, longGroup };
}

function buildLeafBladeMesh(lengthCm, widthCm, thicknessCm, mat) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(widthCm * 0.68, lengthCm * 0.35, 0, lengthCm);
  shape.quadraticCurveTo(-widthCm * 0.68, lengthCm * 0.35, 0, 0);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thicknessCm,
    bevelEnabled: true,
    bevelThickness: thicknessCm * 0.35,
    bevelSize: thicknessCm * 0.35,
    bevelSegments: 2,
    curveSegments: 12
  });
  geom.translate(0, 0, -thicknessCm * 0.5);
  return new THREE.Mesh(geom, mat);
}

/**
 * Builds Sceptile-specific Fierce Face (y = 21.3 - 25.4 cm) matching ref/sceptile/pov/front_sceptile.png,
 * plus 6 Yellow Back Seeds, Multi-Frond Leaf Tail & Forearm Leaf Blades.
 */
function buildSceptileDetails(palette, texLib) {
  const faceGroup = new THREE.Group();
  const ornamentGroup = new THREE.Group();

  const yellowMat = createYarnMaterial(palette.eyeYellow, texLib, 2.5, 2.5);
  const trimRedMat = createYarnMaterial(palette.eyeTrim, texLib, 2, 2);
  const darkGreenMat = createYarnMaterial(palette.leafDark, texLib, 3, 3);
  const midGreenMat = createYarnMaterial(palette.leafMid, texLib, 3, 3);
  const blackMat = new THREE.MeshStandardMaterial({ color: '#141916', roughness: 0.55 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#f7f9f7', roughness: 0.35 });

  // Sleek tapered angular reptilian snout ridge centered cleanly at front +Z (y = 21.8 - 22.8 cm)
  const snoutGroup = new THREE.Group();
  const snoutR = getCaseOuterRadiusAtY(22.15) - 0.12;
  snoutGroup.position.set(0, 22.12, snoutR);
  snoutGroup.rotation.x = 0.22;

  const snoutDome = new THREE.Mesh(new THREE.SphereGeometry(1.12, 20, 14), midGreenMat);
  snoutDome.scale.set(1.12, 0.62, 0.85);
  snoutGroup.add(snoutDome);

  // Subtle pointed snout beak V-tip overhanging front center (like front_sceptile.png)
  const beakTip = new THREE.Mesh(new THREE.ConeGeometry(0.66, 1.05, 12), midGreenMat);
  beakTip.scale.set(1.15, 0.78, 0.68);
  beakTip.position.set(0, -0.22, 0.58);
  beakTip.rotation.x = Math.PI * 0.82;
  snoutGroup.add(beakTip);

  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), blackMat);
    nostril.position.set(side * 0.28, -0.02, 0.86);
    snoutGroup.add(nostril);
  }
  faceGroup.add(snoutGroup);

  // Confident upward-smirking Crimson/Coral lower jaw grin (corners sweep UP toward cheeks)
  const jawCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.38, 22.02, 3.88),
    new THREE.Vector3(-0.78, 21.48, 4.46),
    new THREE.Vector3(0.0, 21.28, 4.66),
    new THREE.Vector3(0.78, 21.48, 4.46),
    new THREE.Vector3(1.38, 22.02, 3.88)
  ]);
  faceGroup.add(new THREE.Mesh(new THREE.TubeGeometry(jawCurve, 22, 0.16, 10, false), trimRedMat));

  // Subtle dark open-mouth inner grin crevice tucked above lower jaw rim
  const grinLine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.20, 22.02, 3.96),
    new THREE.Vector3(0.0, 21.52, 4.60),
    new THREE.Vector3(1.20, 22.02, 3.96)
  ]);
  faceGroup.add(new THREE.Mesh(new THREE.TubeGeometry(grinLine, 18, 0.085, 8, false), blackMat));

  // FIERCE "\ /" V-SLANTED EYES & HOODED BROW RIDGES (y = 22.95 cm) matching front_sceptile.png
  const eyeY = 22.95;
  const eyeSurfaceR = getCaseOuterRadiusAtY(eyeY) - 0.16;

  for (const side of [-1, 1]) {
    const eyePivot = new THREE.Group();
    const angle = side * 0.56;
    eyePivot.position.set(Math.sin(angle) * eyeSurfaceR, eyeY, Math.cos(angle) * eyeSurfaceR);
    eyePivot.rotation.y = angle;
    eyePivot.rotation.x = -0.26; // Matches convex dome surface pitch cleanly

    // Single tilt group guaranteeing "\ /" fierce slope:
    // side = -1 (left): rotZ = -0.32 -> inner (+x) drops DOWN toward nose bridge, outer (-x) lifts UP!
    // side = +1 (right): rotZ = +0.32 -> inner (-x) drops DOWN toward nose bridge, outer (+x) lifts UP!
    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = side * 0.32;

    // Asymmetric sharp sclera: flat hooded upper rim, sharper outer wing (side * +1.05), lower inner point (side * -0.90)
    const innerX = -side * 0.90;
    const outerX = side * 1.06;

    const trimShape = new THREE.Shape();
    trimShape.moveTo(innerX, 0.18);
    trimShape.quadraticCurveTo(0, -0.78, outerX, 0.22);
    trimShape.quadraticCurveTo(0, -0.36, innerX, 0.18);
    const trimMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(trimShape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }),
      trimRedMat
    );
    tiltGroup.add(trimMesh);

    // Bright yellow almond sclera with crisp straight upper eyelid hooded by brow
    const eyeShape = new THREE.Shape();
    eyeShape.moveTo(innerX * 0.94, 0.22);
    eyeShape.quadraticCurveTo(0, 0.36, outerX * 0.96, 0.24); // sharp fierce straight/hooded upper lid
    eyeShape.quadraticCurveTo(0, -0.56, innerX * 0.94, 0.22); // curved lower lid
    const eyeMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(eyeShape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }),
      yellowMat
    );
    eyeMesh.position.z = 0.04;
    tiltGroup.add(eyeMesh);

    // Sharp vertical slit pupil + crisp white catchlight
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.14), blackMat);
    pupil.position.set(side * -0.05, -0.02, 0.26);
    pupil.rotation.z = side * -0.18; // keeps slit nearly vertical even under tilt
    tiltGroup.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), whiteMat);
    glint.position.set(side * 0.06, 0.10, 0.31);
    tiltGroup.add(glint);

    // Sculpted overhanging Dark Forest Green brow ridge rotating identically with tiltGroup ("\ /" fierce hood)
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(innerX * 1.05, 0.34, 0.24),
      new THREE.Vector3(0, 0.42, 0.28),
      new THREE.Vector3(outerX * 1.12, 0.36, 0.20)
    ]);
    const browMesh = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 16, 0.19, 10, false), darkGreenMat);
    tiltGroup.add(browMesh);

    eyePivot.add(tiltGroup);
    faceGroup.add(eyePivot);

    // Sleek angled side brow/head crests along upper shoulder sides (y = 23.8 - 25.3 cm, clear of drawstring & ring)
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.56, 2.05, 14), midGreenMat);
    crest.scale.set(0.88, 1.05, 0.72);
    crest.position.set(side * 2.76, 24.25, 2.74);
    crest.rotation.z = side * -0.62;
    crest.rotation.x = 0.24;
    faceGroup.add(crest);
  }

  configureShadowMesh(faceGroup, 'Sceptile Fierce Front Face & Brow Relief (21.3–25.3 cm)');

  // --- Back & Side 3D Crochet Ornaments ---
  // 1. 6 Plump Yellow Back Seeds (y = 18.8, 15.2, 11.6)
  const seedMat = createYarnMaterial(palette.seedYellow, texLib, 2.5, 2.5);
  for (const sy of [18.8, 15.2, 11.6]) {
    for (const side of [-1, 1]) {
      const a = Math.PI + side * 0.44;
      const seedHolder = new THREE.Group();
      seedHolder.position.set(Math.sin(a) * 4.32, sy, Math.cos(a) * 4.32);
      seedHolder.rotation.y = a;
      seedHolder.rotation.x = 0.24;
      seedHolder.rotation.z = side * -0.18;

      const socket = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.14, 8, 18), darkGreenMat);
      socket.rotation.x = Math.PI / 2;
      seedHolder.add(socket);

      const seed = new THREE.Mesh(new THREE.SphereGeometry(1.08, 18, 16), seedMat);
      seed.scale.set(0.95, 1.24, 0.95);
      seed.position.z = 0.72;
      seedHolder.add(seed);

      ornamentGroup.add(seedHolder);
    }
  }

  // 2. Layered Multi-Frond Leaf Tail (y = 3.6 - 10.5 cm, back -Z)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 3.6, -4.15);

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.6, -2.5),
    new THREE.Vector3(0, 1.6, -5.2),
    new THREE.Vector3(0, 2.8, -7.8)
  ]);
  const stemPts = stemCurve.getSpacedPoints(12);
  for (let i = 0; i < stemPts.length - 1; i++) {
    const t0 = i / (stemPts.length - 1);
    const t1 = (i + 1) / (stemPts.length - 1);
    const r0 = THREE.MathUtils.lerp(1.45, 0.25, t0);
    const r1 = THREE.MathUtils.lerp(1.45, 0.25, t1);
    const segLen = stemPts[i].distanceTo(stemPts[i + 1]);
    const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen + 0.15, 14), midGreenMat);
    segMesh.position.copy(stemPts[i].clone().lerp(stemPts[i + 1], 0.5));
    segMesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      stemPts[i + 1].clone().sub(stemPts[i]).normalize()
    );
    tailGroup.add(segMesh);
  }

  for (let row = 0; row < 5; row++) {
    const t = 0.18 + row * 0.16;
    const anchor = stemCurve.getPointAt(t);
    const frondLen = 4.2 - row * 0.45;
    const frondW = 1.35 - row * 0.1;
    for (const side of [-1, 1]) {
      const upperLeaf = buildLeafBladeMesh(frondLen, frondW, 0.24, darkGreenMat);
      upperLeaf.position.copy(anchor);
      upperLeaf.rotation.order = 'YXZ';
      upperLeaf.rotation.y = side * 0.72;
      upperLeaf.rotation.x = 0.55;
      upperLeaf.rotation.z = side * -0.45;
      tailGroup.add(upperLeaf);

      const lowerLeaf = buildLeafBladeMesh(frondLen * 0.92, frondW * 0.92, 0.22, midGreenMat);
      lowerLeaf.position.copy(anchor).add(new THREE.Vector3(0, -0.35, 0));
      lowerLeaf.rotation.order = 'YXZ';
      lowerLeaf.rotation.y = side * 0.88;
      lowerLeaf.rotation.x = 1.95;
      lowerLeaf.rotation.z = side * -0.35;
      tailGroup.add(lowerLeaf);
    }
  }
  ornamentGroup.add(tailGroup);

  // 3. Compact Forearms + Dual Wrist Leaf Blades (x = ±4.2 cm, y = 14.2 cm)
  for (const side of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 4.2, 14.2, 0.95);
    armPivot.rotation.z = side * 0.55;
    armPivot.rotation.y = side * -0.45;

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.55, 8, 12), midGreenMat);
    arm.position.set(side * 0.7, -0.3, 0.6);
    arm.rotation.z = side * 1.1;
    arm.rotation.x = 0.55;
    armPivot.add(arm);

    const bladePrimary = buildLeafBladeMesh(3.4, 1.15, 0.26, midGreenMat);
    bladePrimary.position.set(side * 1.25, 0.15, 0.95);
    bladePrimary.rotation.z = side * -0.32;
    bladePrimary.rotation.x = -0.18;
    armPivot.add(bladePrimary);

    const bladeSecondary = buildLeafBladeMesh(2.55, 0.92, 0.22, darkGreenMat);
    bladeSecondary.position.set(side * 1.38, -0.05, 0.55);
    bladeSecondary.rotation.z = side * -0.58;
    bladeSecondary.rotation.x = -0.32;
    armPivot.add(bladeSecondary);

    ornamentGroup.add(armPivot);
  }

  configureShadowMesh(ornamentGroup, 'Sceptile Back Seeds, Leaf Tail & Wrist Blades');
  return { faceGroup, ornamentGroup, rimCrestGroup: null };
}

/**
 * Builds Dragonite Face, Upper Collar Antennae + Horn (above Silicone Ring),
 * Wings, Plump Ribbed Tail, Stubby Arms & Feet with 3 White Claws each.
 */
function buildDragoniteDetails(palette, texLib) {
  const faceGroup = new THREE.Group();
  const rimCrestGroup = new THREE.Group();
  const ornamentGroup = new THREE.Group();

  const orangeMat = createYarnMaterial(palette.body, texLib, 3, 3);
  const creamMat = createYarnMaterial(palette.bellyCream, texLib, 3, 3);
  const ribMat = createYarnMaterial(palette.bellyRib, texLib, 2.5, 2.5);
  const tealMat = createYarnMaterial(palette.wingTeal, texLib, 3, 3);
  const clawMat = createYarnMaterial(palette.clawWhite, texLib, 1.5, 1.5);
  const oliveMat = new THREE.MeshStandardMaterial({ color: palette.irisOlive, roughness: 0.45 });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.4 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });

  // Friendly Oval Eyes on convex shoulder (y = 22.85 cm)
  const eyeY = 22.85;
  const eyeSurfaceR = getCaseOuterRadiusAtY(eyeY) - 0.14;
  for (const side of [-1, 1]) {
    const eyePivot = new THREE.Group();
    const angle = side * 0.54;
    eyePivot.position.set(Math.sin(angle) * eyeSurfaceR, eyeY, Math.cos(angle) * eyeSurfaceR);
    eyePivot.rotation.y = angle;
    eyePivot.rotation.x = -0.26;

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.60, 16, 14), whiteMat);
    sclera.scale.set(0.75, 1.24, 0.35);
    eyePivot.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 12), oliveMat);
    iris.scale.set(0.72, 1.15, 0.35);
    iris.position.set(side * -0.06, -0.04, 0.08);
    eyePivot.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), blackMat);
    pupil.scale.set(0.72, 1.12, 0.38);
    pupil.position.set(side * -0.06, -0.04, 0.14);
    eyePivot.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), whiteMat);
    glint.position.set(side * 0.08, 0.22, 0.22);
    eyePivot.add(glint);

    faceGroup.add(eyePivot);
  }

  // Plump rounded crochet snout projecting forward (y = 21.75 cm)
  const snoutZ = getCaseOuterRadiusAtY(21.75) - 0.25;
  const snout = new THREE.Mesh(new THREE.SphereGeometry(1.36, 22, 18), orangeMat);
  snout.scale.set(1.24, 0.80, 0.86);
  snout.position.set(0, 21.75, snoutZ);
  faceGroup.add(snout);

  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), blackMat);
    nostril.position.set(side * 0.42, 21.95, snoutZ + 1.12);
    faceGroup.add(nostril);
  }

  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.76, 21.48, snoutZ + 0.88),
    new THREE.Vector3(0, 21.14, snoutZ + 1.14),
    new THREE.Vector3(0.76, 21.48, snoutZ + 0.88)
  ]);
  faceGroup.add(new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 16, 0.055, 8, false), blackMat));

  configureShadowMesh(faceGroup, 'Dragonite Oval Eyes & Crochet Snout');

  // Top Cuff Horn & 2 S-Curved Cream Antennae anchored at top crochet rim (y = 27.82 cm, above Silicone Ring)
  // Positioned forward of Ø 5.9 cm screw cap so unscrewing lid remains effortless
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.32, 14), orangeMat);
  horn.position.set(0, 28.42, 3.16);
  horn.rotation.x = 0.30;
  rimCrestGroup.add(horn);

  for (const side of [-1, 1]) {
    const antCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.38, 27.78, 2.86),
      new THREE.Vector3(side * 1.82, 28.92, 3.18),
      new THREE.Vector3(side * 2.58, 29.85, 2.72),
      new THREE.Vector3(side * 3.16, 30.88, 2.25)
    ]);
    rimCrestGroup.add(new THREE.Mesh(new THREE.TubeGeometry(antCurve, 24, 0.18, 10, false), creamMat));
  }
  configureShadowMesh(rimCrestGroup, 'Dragonite Rim Antennae & Forehead Horn');

  // Sculpted 2-Tone Wings (y = 14.5 - 22.5 cm, upper back)
  for (const side of [-1, 1]) {
    const wingPivot = new THREE.Group();
    wingPivot.position.set(side * 1.75, 17.8, -3.95);
    wingPivot.rotation.y = side * -0.58;

    const membraneShape = new THREE.Shape();
    membraneShape.moveTo(0, 0.2);
    membraneShape.quadraticCurveTo(side * 1.6, 3.2, side * 3.6, 4.4);
    membraneShape.quadraticCurveTo(side * 5.8, 2.0, side * 6.0, -2.5);
    membraneShape.quadraticCurveTo(side * 4.2, -1.2, side * 2.9, -2.1);
    membraneShape.quadraticCurveTo(side * 1.6, -1.0, 0, -1.5);
    membraneShape.closePath();

    const membraneGeom = new THREE.ExtrudeGeometry(membraneShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2
    });
    membraneGeom.translate(0, 0, -0.12);
    wingPivot.add(new THREE.Mesh(membraneGeom, tealMat));

    const boneCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(side * 1.8, 3.3, -0.1),
      new THREE.Vector3(side * 3.6, 4.45, -0.15),
      new THREE.Vector3(side * 5.2, 2.2, -0.12),
      new THREE.Vector3(side * 6.05, -2.6, -0.05)
    ]);
    wingPivot.add(new THREE.Mesh(new THREE.TubeGeometry(boneCurve, 28, 0.30, 10, false), orangeMat));

    const wingSpur = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.95, 10), orangeMat);
    wingSpur.position.set(side * 3.6, 4.75, -0.15);
    wingSpur.rotation.z = side * -0.25;
    wingPivot.add(wingSpur);

    ornamentGroup.add(wingPivot);
  }

  // Plump Tail with Cream Ribbed Underside (y = 2.0 - 11.5 cm, back -Z)
  const dTailGroup = new THREE.Group();
  const tailSpine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.2, -3.95),
    new THREE.Vector3(0, 3.5, -6.5),
    new THREE.Vector3(0, 4.5, -9.2),
    new THREE.Vector3(0, 7.2, -11.8)
  ]);
  const tailSamples = tailSpine.getSpacedPoints(18);
  for (let i = 0; i < tailSamples.length - 1; i++) {
    const t0 = i / (tailSamples.length - 1);
    const t1 = (i + 1) / (tailSamples.length - 1);
    const r0 = THREE.MathUtils.lerp(2.25, 0.42, Math.pow(t0, 0.85));
    const r1 = THREE.MathUtils.lerp(2.25, 0.42, Math.pow(t1, 0.85));
    const segLen = tailSamples[i].distanceTo(tailSamples[i + 1]);

    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen + 0.25, 18), orangeMat);
    const mid = tailSamples[i].clone().lerp(tailSamples[i + 1], 0.5);
    seg.position.copy(mid);
    seg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      tailSamples[i + 1].clone().sub(tailSamples[i]).normalize()
    );
    dTailGroup.add(seg);

    if (i < tailSamples.length - 2) {
      const under = new THREE.Mesh(new THREE.SphereGeometry(r0 * 0.86, 14, 12), i % 2 === 0 ? creamMat : ribMat);
      under.scale.set(0.85, 0.45, 0.85);
      under.position.copy(mid).add(new THREE.Vector3(0, -r0 * 0.36, 0.12));
      dTailGroup.add(under);
    }
  }
  ornamentGroup.add(dTailGroup);

  // Stubby Arms & Feet with 3 Tiny White Claws each
  for (const side of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 4.2, 14.0, 1.35);
    armPivot.rotation.z = side * 0.48;
    armPivot.rotation.x = 0.38;

    const armMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 1.65, 10, 14), orangeMat);
    armMesh.position.set(side * 0.65, -0.55, 0.55);
    armMesh.rotation.z = side * 0.65;
    armPivot.add(armMesh);

    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.52, 10), clawMat);
      claw.position.set(side * 1.35 + c * 0.24, -1.45, 0.95 + c * 0.18);
      claw.rotation.x = 2.65;
      claw.rotation.z = side * -0.4;
      armPivot.add(claw);
    }
    ornamentGroup.add(armPivot);

    const footPivot = new THREE.Group();
    footPivot.position.set(side * 2.85, 0.95, 3.15);
    footPivot.rotation.y = side * 0.32;

    const footMesh = new THREE.Mesh(new THREE.SphereGeometry(1.18, 16, 14), orangeMat);
    footMesh.scale.set(0.95, 0.78, 1.32);
    footPivot.add(footMesh);

    for (let c = -1; c <= 1; c++) {
      const fClaw = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.56, 10), clawMat);
      fClaw.position.set(c * 0.42, -0.34, 1.52);
      fClaw.rotation.x = Math.PI * 0.48;
      footPivot.add(fClaw);
    }
    ornamentGroup.add(footPivot);
  }

  configureShadowMesh(ornamentGroup, 'Dragonite Wings, Ribbed Tail, Arms & Claws');
  return { faceGroup, rimCrestGroup, ornamentGroup };
}

function createDimensionBadgeSprite(text, accentColor = '#d8a353') {
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(20, 22, 26, 0.92)';
  ctx.beginPath();
  ctx.roundRect(8, 12, 444, 72, 14);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.fillStyle = '#f2efe9';
  ctx.font = '700 30px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 230, 49);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.4, 1.12, 1);
  sprite.renderOrder = 20;
  return sprite;
}

/**
 * Builds CAD dimension line segments + floating cm callouts for crocheters:
 * Ø Dasar: 8.0 cm, Ø Leher: 5.7 cm, Tinggi Case: 28.0 cm, Total Botol: 32.0 cm, Silicone Ring + Kait
 */
export function buildDimensionGuides() {
  const group = new THREE.Group();
  group.name = 'dimension-guides';

  const addCalloutLine = (p1, p2, labelText, badgeOffset, color = '#d8a353') => {
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const dir = p2.clone().sub(p1).normalize();
    const perp = Math.abs(dir.y) > 0.8 ? new THREE.Vector3(0.38, 0, 0) : new THREE.Vector3(0, 0.38, 0);

    const pts = [
      p1,
      p2,
      p1.clone().sub(perp),
      p1.clone().add(perp),
      p2.clone().sub(perp),
      p2.clone().add(perp)
    ];
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      pts[0], pts[1],
      pts[2], pts[3],
      pts[4], pts[5]
    ]);
    group.add(new THREE.LineSegments(lineGeom, lineMat));

    const sprite = createDimensionBadgeSprite(labelText, color);
    sprite.position.copy(p1.clone().lerp(p2, 0.5)).add(badgeOffset);
    group.add(sprite);
  };

  addCalloutLine(
    new THREE.Vector3(-4.0, 0.2, 6.8),
    new THREE.Vector3(4.0, 0.2, 6.8),
    'Ø Dasar: 8.0 cm',
    new THREE.Vector3(0, 1.15, 0.4),
    '#70b088'
  );

  addCalloutLine(
    new THREE.Vector3(-2.85, 27.2, 5.8),
    new THREE.Vector3(2.85, 27.2, 5.8),
    'Leher: Ø 5.7 cm',
    new THREE.Vector3(0, 1.55, 0.4),
    '#a3b8c9'
  );

  addCalloutLine(
    new THREE.Vector3(-7.4, 0.0, 0),
    new THREE.Vector3(-7.4, 28.0, 0),
    'Case: 28.0 cm',
    new THREE.Vector3(-3.3, -3.5, 0),
    '#d8a353'
  );

  addCalloutLine(
    new THREE.Vector3(-9.6, 0.0, -2.0),
    new THREE.Vector3(-9.6, 32.0, -2.0),
    'Total: 32.0 cm',
    new THREE.Vector3(-3.3, 9.5, 0),
    '#c9c4b8'
  );

  addCalloutLine(
    new THREE.Vector3(4.38, 26.85, 0),
    new THREE.Vector3(4.38, 27.60, 0),
    'Silicone Ring + Kait',
    new THREE.Vector3(3.6, 0.1, 0),
    '#d8a353'
  );

  return group;
}

/**
 * Builds a complete, self-contained 1:1 cm Character Case Assembly
 * including the 1L Cuculemon tumbler, crochet shell, Silicone Neck Ring + woven drawstring,
 * and interchangeable straps hooked directly to the molded silicone ear loops.
 */
export function buildCharacterTumblerAssembly(characterId, texLib) {
  const palette = CHARACTER_PALETTES[characterId];
  const root = new THREE.Group();
  root.name = `assembly-${characterId}`;

  const tumbler = buildTumbler1L();
  root.add(tumbler.group);

  const caseGroup = new THREE.Group();
  caseGroup.name = `case-${characterId}`;

  const shell = buildCaseShell(characterId, palette, texLib);
  caseGroup.add(shell.shellGroup);

  const hanger = buildHangerSystem(characterId, palette, texLib);
  caseGroup.add(hanger.group);

  const details =
    characterId === 'sceptile'
      ? buildSceptileDetails(palette, texLib)
      : buildDragoniteDetails(palette, texLib);

  caseGroup.add(details.faceGroup);
  if (details.rimCrestGroup) caseGroup.add(details.rimCrestGroup);
  caseGroup.add(details.ornamentGroup);

  const straps = buildInterchangeableStraps(characterId, palette, texLib, hanger.earMountPoints);
  caseGroup.add(straps.shortGroup);
  caseGroup.add(straps.longGroup);

  root.add(caseGroup);

  function setStrapMode(mode) {
    straps.shortGroup.visible = mode === 'short' || mode === 'both';
    straps.longGroup.visible = mode === 'long' || mode === 'both';
  }

  function setBottleOnly(bottleOnly) {
    caseGroup.visible = !bottleOnly;
  }

  function setXRay(enabled) {
    tumbler.setXRay(enabled);
    for (const m of shell.sleeveMeshes) {
      m.material.transparent = enabled;
      m.material.opacity = enabled ? 0.36 : 1.0;
      m.material.depthWrite = !enabled;
      m.material.needsUpdate = true;
    }
    shell.evaDisc.material.emissive.set(enabled ? '#4db6ff' : '#142636');
    shell.evaDisc.material.emissiveIntensity = enabled ? 0.85 : 0.3;
  }

  setStrapMode('short');

  return {
    root,
    caseGroup,
    straps: {
      shortLengthCm: straps.shortGroup.userData.measuredLengthCm,
      longLengthCm: straps.longGroup.userData.measuredLengthCm
    },
    setStrapMode,
    setBottleOnly,
    setXRay
  };
}
