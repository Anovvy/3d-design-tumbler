import * as THREE from 'three';

/**
 * 1 Three.js unit = 1.0 cm. Y = 0 is the bottom exterior of the crochet case.
 * Front of tumbler/character faces +Z. Left side is -X, Right side is +X, Back is -Z.
 */
export const TUMBLER_SPECS = {
  baseRadius: 4.0,           // Ø 8.0 cm
  bodyTopY: 20.0,
  shoulderTopY: 25.5,
  neckRadius: 2.9,           // Ø 5.8 cm
  neckTopY: 28.0,
  capRadius: 3.25,           // Ø 6.5 cm
  capTopY: 30.2,
  totalHeightY: 32.0,        // Top of flip carry loop
  caseWallThickness: 0.36,   // ~3.6 mm 5-ply milk cotton crochet gauge
  collarInnerRadius: 2.95,
  collarOuterRadius: 3.34,
  dRingInnerWidth: 1.5,
  dRingWireDiameter: 0.3,
  shortStrapLengthCm: 30.0,
  longStrapLengthCm: 100.0
};

export const CHARACTER_PALETTES = {
  sceptile: {
    base: '#73B88C',
    anchorDark: '#4A7A5B',
    body: '#73B88C',
    belt: '#D66865',
    chestBand: '#4A7A5B',
    eyeYellow: '#E6D37A',
    eyeTrim: '#C64D4D',
    seedYellow: '#E6D37A',
    leafDark: '#4A7A5B',
    leafMid: '#73B88C',
    strapColors: ['#2F593D', '#73B88C', '#E6D37A'],
    cuffColor: '#D66865',
    cordEndColor: '#E6D37A'
  },
  dragonite: {
    base: '#E29338',
    anchorDark: '#B56B22',
    body: '#E29338',
    bellyCream: '#DDD0A8',
    bellyRib: '#BFA97A',
    wingTeal: '#146B62',
    irisOlive: '#676E4E',
    clawWhite: '#ECECEC',
    strapColors: ['#E29338', '#146B62', '#DDD0A8'],
    cuffColor: '#DDD0A8',
    cordEndColor: '#DDD0A8'
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

  // Deep stitch trough base
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

    // Subtle twisted yarn ply highlights
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
    // Slight horizontal spiral offset per round (natural amigurumi spiral)
    const offset = (row % 2) * (cellW * 0.12);

    // Subtle horizontal top-loop crown bar per row
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

      // Left V-arm & right V-arm
      for (const side of [-1, 1]) {
        const xTop = cx + side * armSpread;
        const xBot = cx + side * centerJoin;
        drawArm(bCtx, xTop, topY, xBot, botY, armW, true, false);
        drawArm(sCtx, xTop, topY, xBot, botY, armW, false, false);
        drawArm(rCtx, xTop, topY, xBot, botY, armW, false, true);
      }

      // Soft milk-cotton fiber grain
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

  // Ribbed Thermal Stitch bump & shade for 100cm flat strap
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
  // Cross-yarn grooves along ribs
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

  // Draw diagonal barber-pole braided strands wrapping seamlessly across U & V
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

    // Strand crown bump + dark seam
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

  // Fine paracord weave notches
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
 * Generates a character-specific cylindrical tapestry-crochet body color texture
 * where u=0.5 is Front (+Z), u=0/1 is Back (-Z), v=0 is bottom (y=1.5), v=1 is top (y=20.0).
 */
function createCharacterBodyColorMap(characterId, palette, shadeMap) {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Base character yarn color
  ctx.fillStyle = palette.body;
  ctx.fillRect(0, 0, w, h);

  // Helper to convert cm Y (1.5 .. 20.0) into canvas Y (1024 at bottom -> 0 at top)
  const yCmToPx = (yCm) => {
    const t = Math.max(0, Math.min(1, (yCm - 1.5) / (20.0 - 1.5)));
    return (1 - t) * h;
  };

  if (characterId === 'sceptile') {
    // Continuous Coral Red belly belt (y = 7.0 to 9.5 cm)
    const beltTop = yCmToPx(9.5);
    const beltBot = yCmToPx(7.0);
    ctx.fillStyle = palette.belt;
    ctx.fillRect(0, beltTop, w, beltBot - beltTop);

    // Subtle darker stitch outline bordering the coral belt
    ctx.fillStyle = 'rgba(85, 32, 30, 0.24)';
    ctx.fillRect(0, beltTop, w, 4);
    ctx.fillRect(0, beltBot - 4, w, 4);

    // Dark green chest collar band (y = 16.0 to 17.5 cm) with crisp front V-dip at u=0.5
    const bandTopY = yCmToPx(17.5);
    const bandBotY = yCmToPx(16.0);
    const vCenter = w * 0.5;
    const vHalfWidth = w * 0.085;
    const vDip = (yCmToPx(15.0) - bandBotY);

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
    // Rounded Cream Belly Panel across front +Z (u = 0.5 ± 0.165, y = 2.2 to 20.0 cm)
    const centerX = w * 0.5;
    const topY = yCmToPx(20.0);
    const botY = yCmToPx(2.0);
    const midY = (topY + botY) * 0.5;
    const radiusX = w * 0.165;
    const radiusY = (botY - topY) * 0.52;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, midY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = palette.bellyCream;
    ctx.fillRect(0, 0, w, h);

    // 10 crisp horizontal rib lines (#BFA97A)
    const ribYs = [3.6, 5.2, 6.8, 8.4, 10.0, 11.6, 13.2, 14.8, 16.4, 18.0, 19.3];
    ctx.fillStyle = palette.bellyRib;
    for (const ry of ribYs) {
      const py = yCmToPx(ry);
      ctx.fillRect(0, py - 4, w, 8);
    }
    ctx.restore();

    // Subtle crochet seam border around cream panel
    ctx.strokeStyle = palette.bellyRib;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(centerX, midY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Multiply subtle tiled stitch shade so color transitions show crisp crochet loops
  const tileCanvas = shadeMap.image;
  if (tileCanvas) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const repX = 6;
    const repY = 5;
    const tw = w / repX;
    const th = h / repY;
    for (let ix = 0; ix < repX; ix++) {
      for (let iy = 0; iy < repY; iy++) {
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
 *   v = 0.0 -> bottom point, v = 1.0 -> top point (proportional to arc length).
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
      // theta = PI at u=0 (Back -Z), 0/2PI at u=0.5 (Front +Z)
      // At u=0.25 -> theta = 1.5 PI -> sin = -1 (Left -X), cos = 0
      // At u=0.75 -> theta = 2.5 PI -> sin = +1 (Right +X), cos = 0
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

/**
 * Helper to create a realistic matte milk-cotton yarn material with procedural crochet bump & sheen.
 */
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
  const sheenColor = new THREE.Color(colorHex).lerp(new THREE.Color('#ffffff'), 0.35);

  const mat = new THREE.MeshPhysicalMaterial({
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
  mat.userData.originalEmissive = new THREE.Color(0x000000);
  return mat;
}

function createMetalMaterial(colorHex = '#8d98a5', roughness = 0.24) {
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.92,
    roughness
  });
  mat.userData.originalEmissive = new THREE.Color(0x000000);
  return mat;
}

/**
 * Tags every mesh inside a Group with zone metadata for raycasting and zone highlighting.
 */
function tagZone(object3d, zoneId, partName) {
  object3d.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.zoneId = zoneId;
      child.userData.partName = partName;
    }
  });
  return object3d;
}

/**
 * Builds the 1:1 cm 1L Cuculemon Stainless Steel Tumbler (y = 0 to 32.0 cm).
 */
export function buildTumbler1L() {
  const group = new THREE.Group();
  group.name = 'tumbler-1l';

  // Inner bottle body sits cleanly inside the 0.35cm reinforced base
  const bodyProfile = [
    { r: 0.0, y: 0.35 },
    { r: 3.72, y: 0.35 },
    { r: 4.0, y: 0.65 },
    { r: 4.0, y: 20.0 },
    // Smooth tapered shoulder (y = 20.0 to 25.5, r = 4.0 -> 2.9)
    { r: 3.92, y: 20.9 },
    { r: 3.74, y: 21.8 },
    { r: 3.50, y: 22.7 },
    { r: 3.24, y: 23.7 },
    { r: 3.02, y: 24.6 },
    { r: 2.90, y: 25.5 }
  ];

  const bodyGeom = buildSeamlessLatheGeometry(bodyProfile, 56);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#2c3844',
    metalness: 0.32,
    roughness: 0.44
  });
  const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
  bodyMesh.name = 'bottle-body';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Brushed stainless neck band (y = 25.5 to 28.0 cm, r = 2.9 cm / Ø 5.8 cm)
  const neckProfile = [
    { r: 2.90, y: 25.5 },
    { r: 2.90, y: 28.0 },
    { r: 2.72, y: 28.0 }
  ];
  const neckGeom = buildSeamlessLatheGeometry(neckProfile, 56);
  const neckMat = new THREE.MeshStandardMaterial({
    color: '#cfd7df',
    metalness: 0.90,
    roughness: 0.20
  });
  const neckMesh = new THREE.Mesh(neckGeom, neckMat);
  neckMesh.name = 'bottle-neck';
  neckMesh.castShadow = true;
  group.add(neckMesh);

  // Black screw cap (y = 28.0 to 30.2 cm, r = 3.25 cm / Ø 6.5 cm)
  const capGroup = new THREE.Group();
  capGroup.name = 'bottle-cap';
  const capProfile = [
    { r: 2.85, y: 28.0 },
    { r: 3.25, y: 28.04 },
    { r: 3.25, y: 29.85 },
    { r: 3.08, y: 30.2 },
    { r: 0.0, y: 30.2 }
  ];
  const capMat = new THREE.MeshStandardMaterial({
    color: '#191d22',
    metalness: 0.08,
    roughness: 0.48
  });
  const capMesh = new THREE.Mesh(buildSeamlessLatheGeometry(capProfile, 48), capMat);
  capMesh.castShadow = true;
  capGroup.add(capMesh);

  // Grip ribs around black cap
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.55, 0.16), capMat);
    rib.position.set(Math.sin(a) * 3.24, 28.95, Math.cos(a) * 3.24);
    rib.rotation.y = a;
    capGroup.add(rib);
  }

  // Hinged flip carry loop at side reaching y = 32.0 cm (UNCOVERED area)
  const loopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.35, 29.75, -2.55),
    new THREE.Vector3(-1.65, 31.35, -2.95),
    new THREE.Vector3(0.0, 32.0, -3.15),
    new THREE.Vector3(1.65, 31.35, -2.95),
    new THREE.Vector3(1.35, 29.75, -2.55)
  ]);
  const loopMesh = new THREE.Mesh(new THREE.TubeGeometry(loopCurve, 32, 0.28, 12, false), capMat);
  loopMesh.castShadow = true;
  capGroup.add(loopMesh);

  // Hinge bridge on cap back
  const hingeMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.72, 0.85), capMat);
  hingeMesh.position.set(0, 29.65, -2.7);
  capGroup.add(hingeMesh);

  group.add(capGroup);

  // Subtle X-Ray wireframe silhouette shell (hidden by default, shown in X-Ray mode)
  const xrayWireMat = new THREE.MeshBasicMaterial({
    color: '#5ad2ff',
    wireframe: true,
    transparent: true,
    opacity: 0.24
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
        mat.emissiveIntensity = enabled ? 0.45 : 0;
      }
      mat.needsUpdate = true;
    }
  }

  return { group, setXRay };
}

/**
 * Builds the 4-zone crochet shell (Zone 1 Base, Zone 2 Body, Zone 3 Tapered Shoulder, Zone 4 Collar).
 */
function buildCaseShell(characterId, palette, texLib) {
  const shellGroup = new THREE.Group();
  shellGroup.name = `${characterId}-shell`;

  // Zone 1: Reinforced Base (0.0 to 1.5 cm)
  const baseGroup = new THREE.Group();
  const baseProfile = [
    { r: 0.0, y: 0.0 },
    { r: 4.18, y: 0.0 },
    { r: 4.38, y: 0.25 },
    { r: 4.38, y: 1.42 },
    { r: 4.44, y: 1.47 }, // BLO ridge
    { r: 4.36, y: 1.50 }
  ];
  const baseMat = createYarnMaterial(palette.base, texLib, 6, 1.2);
  const baseMesh = new THREE.Mesh(buildSeamlessLatheGeometry(baseProfile, 64), baseMat);
  baseGroup.add(baseMesh);

  // Internal EVA Foam Disc (0.25 to 0.55 cm, visible in X-Ray mode)
  const evaMat = new THREE.MeshStandardMaterial({
    color: '#202833',
    roughness: 0.85,
    metalness: 0.05,
    emissive: '#142636',
    emissiveIntensity: 0.3
  });
  const evaDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.85, 0.3, 48), evaMat);
  evaDisc.position.y = 0.40;
  evaDisc.name = 'eva-foam-disc';
  baseGroup.add(evaDisc);

  tagZone(baseGroup, 'zone-1', 'Base & EVA Foam Reinforcement (0–1.5 cm)');
  shellGroup.add(baseGroup);

  // Zone 2: Cylindrical Body (1.5 to 20.0 cm)
  const bodyColorTex = createCharacterBodyColorMap(characterId, palette, texLib.shadeMap);
  const bodyProfile = [
    { r: 4.36, y: 1.50 },
    { r: 4.36, y: 20.0 }
  ];
  const bodyMat = createYarnMaterial('#ffffff', texLib, 6, 5.2, bodyColorTex);
  const bodyMesh = new THREE.Mesh(buildSeamlessLatheGeometry(bodyProfile, 64), bodyMat);
  tagZone(bodyMesh, 'zone-2', 'Main Crochet Body Sleeve (1.5–20.0 cm)');
  shellGroup.add(bodyMesh);

  // Zone 3: Tapered Shoulder (20.0 to 25.5 cm)
  const shoulderProfile = [
    { r: 4.36, y: 20.0 },
    { r: 4.26, y: 20.9 },
    { r: 4.08, y: 21.8 },
    { r: 3.84, y: 22.7 },
    { r: 3.60, y: 23.7 },
    { r: 3.42, y: 24.6 },
    { r: 3.33, y: 25.5 }
  ];
  const shoulderMat = createYarnMaterial(palette.body, texLib, 5.5, 1.8);
  const shoulderMesh = new THREE.Mesh(buildSeamlessLatheGeometry(shoulderProfile, 64), shoulderMat);
  tagZone(shoulderMesh, 'zone-3', 'Tapered Shoulder & Character Face (20.0–25.5 cm)');
  shellGroup.add(shoulderMesh);

  // Zone 4: Snug Neck Collar (25.5 to 28.0 cm) + Inner Liner Lip
  const collarGroup = new THREE.Group();
  const collarProfile = [
    { r: 3.33, y: 25.5 },
    { r: 3.38, y: 25.8 },
    { r: 3.36, y: 26.35 },
    { r: 3.45, y: 26.80 }, // Drawstring casing bulge
    { r: 3.36, y: 27.30 },
    { r: 3.31, y: 27.90 },
    { r: 3.16, y: 28.02 }, // Top rim lip
    { r: 2.95, y: 27.95 }, // Inner collar wall hugging Ø 5.8 cm neck
    { r: 2.95, y: 25.5 }
  ];
  const collarMat = createYarnMaterial(palette.body, texLib, 5.0, 1.1);
  const collarMesh = new THREE.Mesh(buildSeamlessLatheGeometry(collarProfile, 64), collarMat);
  collarGroup.add(collarMesh);

  tagZone(collarGroup, 'zone-4', 'Snug Neck Collar (25.5–28.0 cm)');
  shellGroup.add(collarGroup);

  return {
    shellGroup,
    sleeveMeshes: [baseMesh, bodyMesh, shoulderMesh, collarMesh],
    evaDisc
  };
}

/**
 * Builds a single Metal Swivel Lobster Clasp (1.5 cm inner eye width) positioned so
 * its hook latch sits at (0, 0, 0) and its strap-eye bar sits at (0, +2.05, 0).
 */
function buildSwivelClasp(metalMat) {
  const clasp = new THREE.Group();

  // Bottom hook C-loop latching onto D-ring
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.72, 0.14),
    new THREE.Vector3(0, 0.42, 0.42),
    new THREE.Vector3(0, 0.0, 0.34),
    new THREE.Vector3(0, -0.14, 0.0),
    new THREE.Vector3(0, 0.04, -0.34),
    new THREE.Vector3(0, 0.48, -0.32),
    new THREE.Vector3(0, 0.78, -0.04)
  ]);
  const hookMesh = new THREE.Mesh(new THREE.TubeGeometry(hookCurve, 24, 0.12, 10, false), metalMat);
  clasp.add(hookMesh);

  // Spring thumb trigger lever
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.24), metalMat);
  trigger.position.set(0, 0.56, 0.48);
  trigger.rotation.x = -0.35;
  clasp.add(trigger);

  // Swivel barrel collar
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.48, 16), metalMat);
  barrel.position.set(0, 1.02, 0);
  clasp.add(barrel);

  // Rectangular 1.5 cm inner width strap loop eye (oriented along Z so strap attaches cleanly)
  const loopProfile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.24, -0.82),
    new THREE.Vector3(0, 1.98, -0.82),
    new THREE.Vector3(0, 2.04, 0),
    new THREE.Vector3(0, 1.98, 0.82),
    new THREE.Vector3(0, 1.24, 0.82),
    new THREE.Vector3(0, 1.24, -0.82)
  ]);
  const eyeMesh = new THREE.Mesh(new THREE.TubeGeometry(loopProfile, 28, 0.11, 10, false), metalMat);
  clasp.add(eyeMesh);

  return clasp;
}

/**
 * Builds Zone 4 Hanger System:
 * - Collar Anchor Ring (y = 25.4–26.2 cm)
 * - Drawstring Paracord + 2-Hole Cord Lock + Pokemon Cord Ends (y = 26.8 cm)
 * - 2 Vertical Load-Bearing Strap Tabs (y = 26.2 down to 20.5 cm on -X & +X)
 * - 2 Metal D-Rings (1.5 cm inner width, 3mm wire)
 */
function buildHangerSystem(characterId, palette, texLib) {
  const group = new THREE.Group();
  group.name = `${characterId}-hanger-system`;

  const paracordTex = createTwistedParacordTextures(palette.strapColors);
  paracordTex.map.repeat.set(9, 1);
  paracordTex.bumpMap.repeat.set(9, 1);

  const cordMat = new THREE.MeshPhysicalMaterial({
    map: paracordTex.map,
    bumpMap: paracordTex.bumpMap,
    bumpScale: 0.12,
    roughness: 0.65,
    metalness: 0.04,
    sheen: 0.2
  });
  cordMat.userData.originalEmissive = new THREE.Color(0x000000);

  // 1. Reinforced Collar Anchor Ring (y = 25.45 to 26.15 cm)
  const anchorMat = createYarnMaterial(palette.anchorDark || palette.base, texLib, 5, 0.5);
  const anchorRing = new THREE.Mesh(new THREE.TorusGeometry(3.38, 0.22, 12, 48), anchorMat);
  anchorRing.rotation.x = Math.PI / 2;
  anchorRing.position.y = 25.8;
  group.add(anchorRing);

  // 2. Drawstring Channel Paracord (y = 26.8 cm) exiting at BACK (-Z) so front character face stays 100% clear
  const drawPts = [];
  const startAngle = Math.PI + 0.22; // exit right of -Z
  const endAngle = Math.PI * 3 - 0.22; // wrap full loop back to left of -Z
  for (let i = 0; i <= 32; i++) {
    const a = startAngle + (i / 32) * (endAngle - startAngle);
    drawPts.push(new THREE.Vector3(Math.sin(a) * 3.44, 26.8, Math.cos(a) * 3.44));
  }
  const drawCurve = new THREE.CatmullRomCurve3(drawPts);
  const drawMesh = new THREE.Mesh(new THREE.TubeGeometry(drawCurve, 44, 0.19, 10, false), cordMat);
  group.add(drawMesh);

  // Two hanging drawstring tails through a 2-hole spring cord lock at back collar (-Z)
  const lockMat = new THREE.MeshStandardMaterial({ color: '#1b1f24', roughness: 0.42, metalness: 0.12 });
  lockMat.userData.originalEmissive = new THREE.Color(0x000000);
  const cordLock = new THREE.Group();
  cordLock.position.set(0, 26.25, -4.18);
  cordLock.rotation.x = 0.26;
  const lockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 1.35, 18), lockMat);
  lockBody.scale.set(1.35, 1, 0.85);
  cordLock.add(lockBody);
  const lockPlunger = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 16), lockMat);
  lockPlunger.position.y = 0.82;
  cordLock.add(lockPlunger);
  group.add(cordLock);

  const beadMat = createYarnMaterial(palette.cordEndColor, texLib, 2, 2);
  for (const side of [-1, 1]) {
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.72, 26.8, -3.40),
      new THREE.Vector3(side * 0.32, 26.45, -4.15),
      new THREE.Vector3(side * 0.34, 25.05, -4.48),
      new THREE.Vector3(side * 0.44, 23.75, -4.66)
    ]);
    const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 20, 0.18, 10, false), cordMat);
    group.add(tailMesh);

    const endBead = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 14), beadMat);
    endBead.scale.set(0.9, 1.15, 0.9);
    endBead.position.set(side * 0.44, 23.55, -4.68);
    group.add(endBead);
  }

  // 3. 2 Vertical Load-Bearing Strap Tabs (y = 26.2 down to 20.5 cm on -X & +X) + Metal D-Rings
  const tabMat = createYarnMaterial(palette.anchorDark || palette.base, texLib, 1.5, 3.5);
  const stitchXMat = createYarnMaterial(palette.cuffColor, texLib, 1, 1);
  const dRingMat = createMetalMaterial('#96a2af', 0.20);
  const dRingMountPoints = [];

  for (const side of [-1, 1]) {
    const tabCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 3.45, 26.15, 0),
      new THREE.Vector3(side * 3.68, 24.6, 0),
      new THREE.Vector3(side * 4.02, 22.8, 0),
      new THREE.Vector3(side * 4.42, 20.55, 0)
    ]);
    const tabGeom = buildFlatRibbonAlongCurve(tabCurve, 1.85, 0.42, 24);
    const tabMesh = new THREE.Mesh(tabGeom, tabMat);
    group.add(tabMesh);

    // Clean flush X-box reinforcement cross-stitching at top (y=25.4) & bottom (y=21.2) of tab
    for (const [ty, tx] of [[25.4, 3.63], [21.2, 4.44]]) {
      for (const diag of [-1, 1]) {
        const xStitch = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 1.25, 4, 8), stitchXMat);
        xStitch.position.set(side * tx, ty, 0);
        xStitch.rotation.x = Math.PI / 2 + diag * 0.42;
        group.add(xStitch);
      }
    }

    // Folded keeper loop holding the Metal D-Ring at y = 24.45 cm
    const keeper = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.75, 16), tabMat);
    keeper.rotation.x = Math.PI / 2;
    keeper.position.set(side * 3.92, 24.45, 0);
    group.add(keeper);

    // Metal D-Ring (1.5 cm inner width, 3mm wire = 0.15 cm radius)
    const wHalf = 0.75 + 0.15; // 1.5 cm inner width + wire radius
    const dCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 3.92, 24.45, -wHalf),
      new THREE.Vector3(side * 3.92, 24.45, wHalf),
      new THREE.Vector3(side * 4.18, 25.05, wHalf * 0.92),
      new THREE.Vector3(side * 4.30, 25.60, 0),
      new THREE.Vector3(side * 4.18, 25.05, -wHalf * 0.92),
      new THREE.Vector3(side * 3.92, 24.45, -wHalf)
    ]);
    const dRing = new THREE.Mesh(new THREE.TubeGeometry(dCurve, 32, 0.15, 12, true), dRingMat);
    group.add(dRing);

    dRingMountPoints.push(new THREE.Vector3(side * 4.28, 25.62, 0));
  }

  tagZone(group, 'zone-4', 'Drawstring Collar, Load Tabs & Metal D-Rings (25.5–28.0 cm)');
  return { group, dRingMountPoints };
}

/**
 * Sweeps a rounded-rectangle cross section along a CatmullRomCurve3 using stable Bishop/parallel-transport frames.
 */
function buildFlatRibbonAlongCurve(curve, width = 2.0, thickness = 0.5, segments = 120) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pts = curve.getSpacedPoints(segments);

  // Build rounded-rectangle cross-section in local (N, B) coordinates
  const ringPts = 14;
  const localProfile = [];
  const hw = width * 0.5;
  const ht = thickness * 0.5;
  for (let k = 0; k < ringPts; k++) {
    const a = (k / ringPts) * Math.PI * 2;
    // Superellipse exponent 0.55 yields a clean rounded flat strap cross section
    const cx = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.55) * ht;
    const cz = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.55) * hw;
    localProfile.push([cx, cz]);
  }

  const positions = [];
  const uvs = [];
  const indices = [];
  const len = curve.getLength();

  // Compute rotation-minimizing frame relative to global +Z/normal so ribbon stays flat and twist-free
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

/**
 * Calibrates a parametric CatmullRomCurve3 via binary search so curve.getLength() equals targetCm.
 */
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
 * Builds Zone 6 Interchangeable Straps:
 *  - Short Strap (30 cm twisted 3-color paracord arch + cuffs + swivel clasps)
 *  - Long Strap (100 cm flat Thermal Stitch crochet sling + paracord tips + swivel clasps)
 */
function buildInterchangeableStraps(characterId, palette, texLib, mountPoints) {
  const [leftMount, rightMount] = mountPoints;
  const metalMat = createMetalMaterial('#9ba7b4', 0.20);

  // Clasp eye endpoints (~2.0 cm above D-ring hook)
  const leftEye = new THREE.Vector3(leftMount.x, leftMount.y + 1.98, leftMount.z);
  const rightEye = new THREE.Vector3(rightMount.x, rightMount.y + 1.98, rightMount.z);

  // --- A. SHORT STRAP (30 cm, Gambar 2 style) ---
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
    7.0,
    18.0,
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
  shortRopeMat.userData.originalEmissive = new THREE.Color(0x000000);

  const shortTube = new THREE.Mesh(new THREE.TubeGeometry(shortCurve, 96, 0.54, 14, false), shortRopeMat);
  shortGroup.add(shortTube);

  // Wrapped crochet collar sleeves near both clasps (like Gambar 2)
  const cuffMat = createYarnMaterial(palette.cuffColor, texLib, 2.5, 2);
  const addEndCuff = (tStart, tEnd) => {
    const subPts = [];
    for (let s = 0; s <= 12; s++) {
      subPts.push(shortCurve.getPointAt(tStart + (s / 12) * (tEnd - tStart)));
    }
    const subCurve = new THREE.CatmullRomCurve3(subPts);
    const cuffMesh = new THREE.Mesh(new THREE.TubeGeometry(subCurve, 16, 0.68, 14, false), cuffMat);
    shortGroup.add(cuffMesh);
  };
  addEndCuff(0.0, 0.115);
  addEndCuff(0.885, 1.0);

  // Swivel clasps for short strap
  for (const mp of [leftMount, rightMount]) {
    const clasp = buildSwivelClasp(metalMat);
    clasp.position.copy(mp);
    shortGroup.add(clasp);
  }

  shortGroup.userData.measuredLengthCm = Number(shortCurve.getLength().toFixed(1));
  tagZone(shortGroup, 'zone-6', `Short Strap (${shortGroup.userData.measuredLengthCm} cm Twisted Paracord)`);

  // --- B. LONG STRAP (100 cm Crossbody Thermal Stitch Sling) ---
  const longGroup = new THREE.Group();
  longGroup.name = `${characterId}-strap-long`;

  // Clasp points tilted gently outward/forward for the 100 cm sling
  const leftSlingEye = new THREE.Vector3(leftMount.x - 0.52, leftMount.y + 1.72, 0.88);
  const rightSlingEye = new THREE.Vector3(rightMount.x + 0.52, rightMount.y + 1.72, 0.88);

  const longCurve = calibrateCurveToLength(
    (k) =>
      new THREE.CatmullRomCurve3([
        leftSlingEye.clone(),
        new THREE.Vector3(-6.4 * k, 28.4, 2.0 * k),
        new THREE.Vector3(-12.2 * k, 18.0, 5.2 * k),
        new THREE.Vector3(-13.8 * k, 2.8, 10.6 * k),
        new THREE.Vector3(-7.6 * k, 0.72, 15.2 * k),
        new THREE.Vector3(0, 0.64, 16.5 * k),
        new THREE.Vector3(7.6 * k, 0.72, 15.0 * k),
        new THREE.Vector3(13.8 * k, 2.8, 10.2 * k),
        new THREE.Vector3(12.0 * k, 17.6, 4.8 * k),
        new THREE.Vector3(6.4 * k, 28.2, 1.8 * k),
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
  longStrapMat.userData.originalEmissive = new THREE.Color(0x000000);

  const longRibbonGeom = buildFlatRibbonAlongCurve(longCurve, 2.0, 0.52, 180);
  const longRibbonMesh = new THREE.Mesh(longRibbonGeom, longStrapMat);
  longGroup.add(longRibbonMesh);

  // Visible inner paracord reinforcement tips + wrapped cuffs near clasps
  const tipCordTex = createTwistedParacordTextures(palette.strapColors);
  tipCordTex.map.repeat.set(4, 1);
  const tipCordMat = new THREE.MeshStandardMaterial({ map: tipCordTex.map, roughness: 0.65 });
  tipCordMat.userData.originalEmissive = new THREE.Color(0x000000);

  for (const [mp, eye, side] of [
    [leftMount, leftSlingEye, -1],
    [rightMount, rightSlingEye, 1]
  ]) {
    const clasp = buildSwivelClasp(metalMat);
    clasp.position.copy(mp);
    clasp.rotation.z = side * 0.25;
    clasp.rotation.x = 0.42;
    longGroup.add(clasp);

    // Wrapped sleeve cuff & visible inner paracord tip
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
  tagZone(longGroup, 'zone-6', `Long Crossbody Strap (${longGroup.userData.measuredLengthCm} cm Thermal Stitch)`);

  return { shortGroup, longGroup };
}

/**
 * Helper to create a curved 3D crochet leaf blade / wing frame using beveled ExtrudeGeometry.
 */
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
 * Builds Sceptile-specific Face (Zone 3) and Back/Side 3D Crochet Ornaments (Zone 5).
 */
function buildSceptileDetails(palette, texLib) {
  const faceGroup = new THREE.Group();
  const ornamentGroup = new THREE.Group();

  const yellowMat = createYarnMaterial(palette.eyeYellow, texLib, 2.5, 2.5);
  const trimRedMat = createYarnMaterial(palette.eyeTrim, texLib, 2, 2);
  const darkGreenMat = createYarnMaterial(palette.leafDark, texLib, 3, 3);
  const midGreenMat = createYarnMaterial(palette.leafMid, texLib, 3, 3);
  const blackMat = new THREE.MeshStandardMaterial({ color: '#141916', roughness: 0.55 });
  blackMat.userData.originalEmissive = new THREE.Color(0x000000);
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#f7f9f7', roughness: 0.35 });
  whiteMat.userData.originalEmissive = new THREE.Color(0x000000);

  // --- ZONE 5: Sharp Sceptile Eyes, Brow Ridge, Lower Jaw Trim & Pointed Crests (y = 21.6–27.8) ---
  // Sculpted subtle front snout bridge & coral lower-jaw accent
  const snoutBridge = new THREE.Mesh(new THREE.SphereGeometry(1.18, 18, 14), midGreenMat);
  snoutBridge.scale.set(1.12, 0.72, 0.62);
  snoutBridge.position.set(0, 22.05, 3.72);
  faceGroup.add(snoutBridge);

  const jawCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.12, 21.75, 3.82),
    new THREE.Vector3(0, 21.38, 4.34),
    new THREE.Vector3(1.12, 21.75, 3.82)
  ]);
  const lowerJaw = new THREE.Mesh(new THREE.TubeGeometry(jawCurve, 18, 0.17, 10, false), trimRedMat);
  faceGroup.add(lowerJaw);

  for (const side of [-1, 1]) {
    const eyePivot = new THREE.Group();
    const angle = side * 0.54; // ~31 deg from front +Z
    const rSurface = 3.82;
    eyePivot.position.set(Math.sin(angle) * rSurface, 22.95, Math.cos(angle) * rSurface);
    eyePivot.rotation.y = angle;
    eyePivot.rotation.x = -0.18;

    // Crimson lower eye-lid trim
    const trimShape = new THREE.Shape();
    trimShape.moveTo(-1.02, 0.26);
    trimShape.quadraticCurveTo(0, -0.84, 1.02, 0.16);
    trimShape.quadraticCurveTo(0, -0.32, -1.02, 0.26);
    const trimMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(trimShape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }),
      trimRedMat
    );
    trimMesh.rotation.z = side * -0.26;
    eyePivot.add(trimMesh);

    // Bright yellow almond eye sclera
    const eyeShape = new THREE.Shape();
    eyeShape.moveTo(-0.96, 0.24);
    eyeShape.quadraticCurveTo(0.05, 0.72, 0.96, 0.15);
    eyeShape.quadraticCurveTo(0.05, -0.58, -0.96, 0.24);
    const eyeMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(eyeShape, { depth: 0.20, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 }),
      yellowMat
    );
    eyeMesh.position.z = 0.05;
    eyeMesh.rotation.z = side * -0.26;
    eyePivot.add(eyeMesh);

    // Vertical slit pupil + white glint
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.64, 0.16), blackMat);
    pupil.position.set(side * -0.04, 0.06, 0.24);
    pupil.rotation.z = side * -0.12;
    eyePivot.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), whiteMat);
    glint.position.set(side * 0.09, 0.24, 0.30);
    eyePivot.add(glint);

    // Angled dark-green brow ridge above eye
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.65, 6, 10), darkGreenMat);
    brow.position.set(0, 0.60, 0.16);
    brow.rotation.z = Math.PI / 2 + side * -0.32;
    eyePivot.add(brow);

    faceGroup.add(eyePivot);

    // Pointed twin Sceptile head crests leaning slightly forward/outward at collar sides (keeps y=28-32 cap clear)
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.68, 2.45, 14), midGreenMat);
    crest.scale.set(0.85, 1.0, 0.68);
    crest.position.set(side * 2.18, 26.25, 2.88);
    crest.rotation.z = side * -0.42;
    crest.rotation.x = 0.34;
    faceGroup.add(crest);
  }

  // Subtle embroidered nostrils at front snout center
  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), darkGreenMat);
    nostril.position.set(side * 0.34, 22.12, 4.38);
    faceGroup.add(nostril);
  }

  tagZone(faceGroup, 'zone-5', 'Sceptile Front Face, Slanted Eyes & Brow Relief (21.5–25.5 cm)');

  // --- ZONE 5: 6 Yellow Back Seeds, Layered Leaf Tail, Forearm Leaf Blades ---
  // 1. 6 Plump Yellow Back Seeds (3 pairs at y = 18.6, 15.2, 11.8)
  const seedMat = createYarnMaterial(palette.seedYellow, texLib, 2.5, 2.5);
  const seedYs = [18.5, 15.1, 11.7];
  for (const sy of seedYs) {
    for (const side of [-1, 1]) {
      const a = Math.PI + side * 0.44; // ±155 deg on back
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

  // 2. Layered Multi-Frond Leaf Tail (y = 2.0–10.5 cm, back -Z)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 3.6, -4.15);

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.6, -2.5),
    new THREE.Vector3(0, 1.6, -5.2),
    new THREE.Vector3(0, 2.8, -7.8)
  ]);
  const stemRadii = [1.45, 1.15, 0.72, 0.25];
  const stemPts = stemCurve.getSpacedPoints(12);
  for (let i = 0; i < stemPts.length - 1; i++) {
    const t0 = i / (stemPts.length - 1);
    const t1 = (i + 1) / (stemPts.length - 1);
    const r0 = THREE.MathUtils.lerp(stemRadii[0], stemRadii[3], t0);
    const r1 = THREE.MathUtils.lerp(stemRadii[0], stemRadii[3], t1);
    const segLen = stemPts[i].distanceTo(stemPts[i + 1]);
    const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen + 0.15, 14), midGreenMat);
    const mid = stemPts[i].clone().lerp(stemPts[i + 1], 0.5);
    segMesh.position.copy(mid);
    segMesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      stemPts[i + 1].clone().sub(stemPts[i]).normalize()
    );
    tailGroup.add(segMesh);
  }

  // Symmetrical upper & lower palm-leaf fronds radiating out from tail stem
  for (let row = 0; row < 5; row++) {
    const t = 0.18 + row * 0.16;
    const anchor = stemCurve.getPointAt(t);
    const frondLen = 4.2 - row * 0.45;
    const frondW = 1.35 - row * 0.1;
    for (const side of [-1, 1]) {
      // Upper dark-green frond pair
      const upperLeaf = buildLeafBladeMesh(frondLen, frondW, 0.24, darkGreenMat);
      upperLeaf.position.copy(anchor);
      upperLeaf.rotation.order = 'YXZ';
      upperLeaf.rotation.y = side * 0.72;
      upperLeaf.rotation.x = 0.55;
      upperLeaf.rotation.z = side * -0.45;
      tailGroup.add(upperLeaf);

      // Lower medium-green frond pair
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

  // 3. Compact Forearms + Forearm Leaf Blades (x = ±4.5 cm, y = 13.5 cm, angled cleanly forward-side)
  for (const side of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 4.2, 13.8, 0.95);
    armPivot.rotation.z = side * 0.55;
    armPivot.rotation.y = side * -0.45;

    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.55, 8, 12), midGreenMat);
    arm.position.set(side * 0.7, -0.3, 0.6);
    arm.rotation.z = side * 1.1;
    arm.rotation.x = 0.55;
    armPivot.add(arm);

    // 2 layered leaf blades rising off forearm
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

  tagZone(ornamentGroup, 'zone-6', 'Sceptile Back Seeds, Leaf Tail & Forearm Blades');
  return { faceGroup, ornamentGroup, rimCrestGroup: null };
}

/**
 * Builds Dragonite-specific Face (Zone 3), Head Crest Antennae + Horn (Zone 4),
 * and Wings / Tail / Arms / Feet with White Claws (Zone 5).
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
  oliveMat.userData.originalEmissive = new THREE.Color(0x000000);
  const blackMat = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.4 });
  blackMat.userData.originalEmissive = new THREE.Color(0x000000);
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
  whiteMat.userData.originalEmissive = new THREE.Color(0x000000);

  // --- ZONE 3: Friendly Oval Dragonite Eyes + Rounded Crochet Snout (y = 20.6–24.2 cm) ---
  for (const side of [-1, 1]) {
    const eyePivot = new THREE.Group();
    const angle = side * 0.54; // ~31 deg from +Z
    const rSurface = 3.74;
    eyePivot.position.set(Math.sin(angle) * rSurface, 22.9, Math.cos(angle) * rSurface);
    eyePivot.rotation.y = angle;
    eyePivot.rotation.x = -0.22;

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 14), whiteMat);
    sclera.scale.set(0.75, 1.25, 0.35);
    eyePivot.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 12), oliveMat);
    iris.scale.set(0.72, 1.16, 0.35);
    iris.position.set(side * -0.06, -0.04, 0.08);
    eyePivot.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), blackMat);
    pupil.scale.set(0.72, 1.14, 0.38);
    pupil.position.set(side * -0.06, -0.04, 0.14);
    eyePivot.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), whiteMat);
    glint.position.set(side * 0.08, 0.24, 0.22);
    eyePivot.add(glint);

    faceGroup.add(eyePivot);
  }

  // Soft plump crochet snout projecting slightly at front center (y = 21.0–22.4 cm)
  const snout = new THREE.Mesh(new THREE.SphereGeometry(1.38, 22, 18), orangeMat);
  snout.scale.set(1.25, 0.82, 0.88);
  snout.position.set(0, 21.55, 3.88);
  faceGroup.add(snout);

  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), blackMat);
    nostril.position.set(side * 0.44, 21.75, 5.02);
    faceGroup.add(nostril);
  }

  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.78, 21.25, 4.78),
    new THREE.Vector3(0, 20.92, 5.04),
    new THREE.Vector3(0.78, 21.25, 4.78)
  ]);
  const smile = new THREE.Mesh(new THREE.TubeGeometry(smileCurve, 16, 0.055, 8, false), blackMat);
  faceGroup.add(smile);

  tagZone(faceGroup, 'zone-5', 'Dragonite Oval Eyes & Crochet Snout (20.6–25.5 cm)');

  // --- ZONE 5 RIM CREST: 2 Wavy Cream Antennae + 1 Small Central Horn at y = 27.6 cm front rim ---
  // Positioned carefully at r = 3.26 cm forward (+Z) so the Ø 6.5 cm screw cap twists unobstructed!
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.45, 14), orangeMat);
  horn.position.set(0, 28.35, 3.12);
  horn.rotation.x = 0.24;
  rimCrestGroup.add(horn);

  for (const side of [-1, 1]) {
    const antCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.42, 27.62, 2.90),
      new THREE.Vector3(side * 1.78, 28.85, 3.22),
      new THREE.Vector3(side * 2.55, 29.75, 2.75),
      new THREE.Vector3(side * 3.15, 30.85, 2.25)
    ]);
    const ant = new THREE.Mesh(new THREE.TubeGeometry(antCurve, 24, 0.19, 10, false), creamMat);
    rimCrestGroup.add(ant);
  }
  tagZone(rimCrestGroup, 'zone-5', 'Dragonite Rim Antennae & Small Horn (27.6 cm)');

  // --- ZONE 5: Wings, Plump Ribbed Tail, Stubby Arms & Feet with 3 White Claws ---
  // 1. Pair of Sculpted Wings (y = 14.5–22.5 cm on upper back)
  for (const side of [-1, 1]) {
    const wingPivot = new THREE.Group();
    wingPivot.position.set(side * 1.75, 17.6, -3.95);
    wingPivot.rotation.y = side * -0.58; // angles cleanly outward/backward without touching side straps

    // Inner deep-teal crocheted wing membrane
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
    const membraneMesh = new THREE.Mesh(membraneGeom, tealMat);
    wingPivot.add(membraneMesh);

    // Golden-orange crochet wing bone frame wrapping top + tip
    const boneCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(side * 1.8, 3.3, -0.1),
      new THREE.Vector3(side * 3.6, 4.45, -0.15),
      new THREE.Vector3(side * 5.2, 2.2, -0.12),
      new THREE.Vector3(side * 6.05, -2.6, -0.05)
    ]);
    const boneMesh = new THREE.Mesh(new THREE.TubeGeometry(boneCurve, 28, 0.30, 10, false), orangeMat);
    wingPivot.add(boneMesh);

    // Top wing thumb claw spur
    const wingSpur = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.95, 10), orangeMat);
    wingSpur.position.set(side * 3.6, 4.75, -0.15);
    wingSpur.rotation.z = side * -0.25;
    wingPivot.add(wingSpur);

    ornamentGroup.add(wingPivot);
  }

  // 2. Plump Dragonite Tail (y = 1.8–11.5 cm, back -Z) with Cream Ribbed Underside
  const dTailGroup = new THREE.Group();
  const tailSpine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.2, -3.95),
    new THREE.Vector3(0, 3.5, -6.5),
    new THREE.Vector3(0, 4.5, -9.2),
    new THREE.Vector3(0, 7.2, -11.8)
  ]);
  const tailSamples = tailSpine.getSpacedPoints(18);
  const radii = [2.25, 1.85, 1.25, 0.42];
  for (let i = 0; i < tailSamples.length - 1; i++) {
    const t0 = i / (tailSamples.length - 1);
    const t1 = (i + 1) / (tailSamples.length - 1);
    const r0 = THREE.MathUtils.lerp(radii[0], radii[3], Math.pow(t0, 0.85));
    const r1 = THREE.MathUtils.lerp(radii[0], radii[3], Math.pow(t1, 0.85));
    const segLen = tailSamples[i].distanceTo(tailSamples[i + 1]);

    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen + 0.25, 18), orangeMat);
    const mid = tailSamples[i].clone().lerp(tailSamples[i + 1], 0.5);
    seg.position.copy(mid);
    seg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      tailSamples[i + 1].clone().sub(tailSamples[i]).normalize()
    );
    dTailGroup.add(seg);

    // Cream ribbed underside patch along bottom of each tail segment
    if (i < tailSamples.length - 2) {
      const under = new THREE.Mesh(new THREE.SphereGeometry(r0 * 0.86, 14, 12), i % 2 === 0 ? creamMat : ribMat);
      under.scale.set(0.85, 0.45, 0.85);
      under.position.copy(mid).add(new THREE.Vector3(0, -r0 * 0.36, 0.12));
      dTailGroup.add(under);
    }
  }
  ornamentGroup.add(dTailGroup);

  // 3. Stubby Crochet Arms & Feet with 3 Tiny White Claws each
  for (const side of [-1, 1]) {
    // Stubby arm (y = 13.6 cm)
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 4.2, 13.8, 1.35);
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

    // Chunky rounded foot resting at y = 0 with 3 white claws
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

  tagZone(ornamentGroup, 'zone-6', 'Dragonite Wings, Ribbed Tail, Arms & Claws');
  return { faceGroup, rimCrestGroup, ornamentGroup };
}

/**
 * Creates a crisp CAD-style floating dimension badge sprite (no depth occlusion).
 */
function createDimensionBadgeSprite(text, accentColor = '#e8a849') {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(13, 18, 26, 0.90)';
  ctx.beginPath();
  ctx.roundRect(8, 12, 404, 72, 22);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#f3f6fa';
  ctx.font = '700 32px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 210, 49);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4.8, 1.08, 1);
  sprite.renderOrder = 20;
  return sprite;
}

/**
 * Builds CAD dimension line segments + floating cm callouts for crocheters.
 */
export function buildDimensionGuides() {
  const group = new THREE.Group();
  group.name = 'dimension-guides';

  const addCalloutLine = (p1, p2, labelText, badgeOffset, color = '#e8a849') => {
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
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    group.add(lines);

    const sprite = createDimensionBadgeSprite(labelText, color);
    sprite.position.copy(p1.clone().lerp(p2, 0.5)).add(badgeOffset);
    group.add(sprite);
  };

  // Base Diameter Ø 8.0 cm
  addCalloutLine(
    new THREE.Vector3(-4.0, 0.2, 6.8),
    new THREE.Vector3(4.0, 0.2, 6.8),
    'Ø Dasar: 8.0 cm',
    new THREE.Vector3(0, 1.15, 0.4),
    '#6ec494'
  );

  // Neck Diameter Ø 5.8 cm
  addCalloutLine(
    new THREE.Vector3(-2.9, 26.8, 5.8),
    new THREE.Vector3(2.9, 26.8, 5.8),
    'Ø Leher: 5.8 cm',
    new THREE.Vector3(0, 1.45, 0.4),
    '#66d2ff'
  );

  // Case Height 28.0 cm
  addCalloutLine(
    new THREE.Vector3(-7.4, 0.0, 0),
    new THREE.Vector3(-7.4, 28.0, 0),
    'Tinggi Case: 28.0 cm',
    new THREE.Vector3(-3.3, -3.5, 0),
    '#e8a849'
  );

  // Total Tumbler + Cap Height 32.0 cm
  addCalloutLine(
    new THREE.Vector3(-9.6, 0.0, -2.0),
    new THREE.Vector3(-9.6, 32.0, -2.0),
    'Total Botol: 32.0 cm',
    new THREE.Vector3(-3.3, 9.5, 0),
    '#b8c7da'
  );

  // D-Ring 1.5 cm callout on right shoulder
  addCalloutLine(
    new THREE.Vector3(5.3, 24.45, -0.75),
    new THREE.Vector3(5.3, 24.45, 0.75),
    'D-Ring: 1.5 cm',
    new THREE.Vector3(3.3, -1.2, 0),
    '#e8a849'
  );

  return group;
}

/**
 * Builds a complete, self-contained 1:1 cm Character Case Assembly
 * including the 1L Cuculemon tumbler, 6-zone crochet assembly, and interchangeable straps.
 */
export function buildCharacterTumblerAssembly(characterId, texLib) {
  const palette = CHARACTER_PALETTES[characterId];
  const root = new THREE.Group();
  root.name = `assembly-${characterId}`;

  // 1L Tumbler
  const tumbler = buildTumbler1L();
  root.add(tumbler.group);

  // Crochet Case & Strap Container (hidden when "Bottle Only" toggle is active)
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

  const straps = buildInterchangeableStraps(characterId, palette, texLib, hanger.dRingMountPoints);
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
      m.material.opacity = enabled ? 0.38 : 1.0;
      m.material.depthWrite = !enabled;
      m.material.needsUpdate = true;
    }
    shell.evaDisc.material.userData.originalEmissive = new THREE.Color(enabled ? '#4db6ff' : '#142636');
    shell.evaDisc.material.userData.originalEmissiveIntensity = enabled ? 0.85 : 0.3;
    shell.evaDisc.material.emissive.copy(shell.evaDisc.material.userData.originalEmissive);
    shell.evaDisc.material.emissiveIntensity = shell.evaDisc.material.userData.originalEmissiveIntensity;
  }

  function highlightZone(activeZoneId) {
    caseGroup.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const isMatch = Boolean(activeZoneId) && child.userData.zoneId === activeZoneId;
      for (const mat of mats) {
        if (!('emissive' in mat)) continue;
        if (isMatch) {
          mat.emissive.set('#e8a849');
          mat.emissiveIntensity = 0.24;
        } else {
          mat.emissive.copy(mat.userData.originalEmissive || new THREE.Color(0x000000));
          mat.emissiveIntensity = mat.userData.originalEmissiveIntensity ?? 0.0;
        }
      }
    });
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
    setXRay,
    highlightZone
  };
}
