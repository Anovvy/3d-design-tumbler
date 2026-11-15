import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  createCrochetTextureLibrary,
  buildCharacterTumblerAssembly,
  buildDimensionGuides
} from './models/crochet_builder.js';
import { PROJECT_SPECS, BOM_COMPONENTS, CHARACTERS } from './data/project_specs.js';

const FALLBACK_YARN = {
  sceptile: [
    { name: 'Mint / Emerald Green (Polycherry D27)', hex: '#68C481', grams: 185, usage: 'Bodi utama, kerah leher, ekor, lengan' },
    { name: 'Dark Forest Green (Polycherry D27)', hex: '#438D5A', grams: 55, usage: 'Garis V dada, alis, bilah daun atas' },
    { name: 'Coral / Salmon Red (Polycherry D27)', hex: '#D6615D', grams: 38, usage: 'Sabuk perut, rahang bawah, cuff tali' },
    { name: 'Warm Yellow (Polycherry D27)', hex: '#E4D17C', grams: 30, usage: '6 biji punggung 3D & iris mata' }
  ],
  dragonite: [
    { name: 'Golden Tangerine Orange (Polycherry D27)', hex: '#EC9D41', grams: 190, usage: 'Bodi utama, kerah, ekor, sayap, tanduk' },
    { name: 'Warm Cream / Ivory (Polycherry D27)', hex: '#EAD8B3', grams: 75, usage: 'Panel perut bergaris, bawah ekor, 2 antena' },
    { name: 'Deep Ocean Teal (Polycherry D27)', hex: '#167B75', grams: 35, usage: 'Membran sayap dalam & cuff aksen tali' },
    { name: 'Off-White / Light Grey (Polycherry D27)', hex: '#DCE0E5', grams: 18, usage: '12 cakar kerucut tangan & kaki' }
  ]
};

const FALLBACK_BOM = [
  {
    name: 'Ring Silikon Leher Botol Tumbler Wide-Mouth (Ø 5.5 - 6.0 cm)',
    spec: 'Cincin karet silikon elastis matte hitam untuk leher tumbler 18oz-32oz + 2 kuping kait samping',
    fitNote: 'Dipasang di manset rajut Ø 5.7 cm (y 26.8-27.6 cm) & dijahit di 4 titik dengan Polycherry',
    qtyPerCase: '1 pcs',
    estPriceIdr: 18000,
    shopeeUrl: 'https://shopee.co.id/search?keyword=ring+silikon+tumbler+leher+botol+5.5+cm+6+cm'
  },
  {
    name: 'Kait Udang Putar / Swivel Lobster Clasp (1.5 cm)',
    spec: 'Zinc alloy heavy-duty putar 360°, lebar lubang tali 1.5 cm',
    fitNote: 'Dikaitkan langsung ke lubang kuping silikon kiri & kanan (2 pcs/tali)',
    qtyPerCase: '4 pcs',
    estPriceIdr: 10000,
    shopeeUrl: 'https://shopee.co.id/search?keyword=kait+udang+tas+1.5+cm+tebal'
  },
  {
    name: 'Stopper Tali / Spring Cord Lock 2 Lubang',
    spec: 'Plastik POM pegas kuat, lubang Ø 4.5 - 5.0 mm',
    fitNote: 'Mengunci tali serut paracord 4 mm beranyam 14 eyelet di leher y 25.8 cm',
    qtyPerCase: '1 pcs',
    estPriceIdr: 2000,
    shopeeUrl: 'https://shopee.co.id/search?keyword=stopper+tali+cord+lock+2+lubang+4mm'
  },
  {
    name: 'Tali Paracord 550 Tipe III (4 mm)',
    spec: 'Nylon 7-strand core (tahan > 200 kg, 0% melar)',
    fitNote: 'Tali serut leher + inti tali pendek 30 cm & tali panjang Thermal Stitch 100 cm',
    qtyPerCase: '3 meter',
    estPriceIdr: 13500,
    shopeeUrl: 'https://shopee.co.id/search?keyword=tali+paracord+550+4mm+per+meter'
  },
  {
    name: 'Busa EVA / Spon Ati Lembaran 4 mm',
    spec: 'Potongan cakram Ø 7.8 cm padat anti-kempes',
    fitNote: 'Diselipkan di dalam alas ganda untuk menopang beban 1.3 kg botol 1L',
    qtyPerCase: '1 lembar kecil',
    estPriceIdr: 12000,
    shopeeUrl: 'https://shopee.co.id/search?keyword=spon+ati+busa+eva+lembaran+4mm'
  }
];

const HEX_COLOR_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;

function extractHexFromText(text, fallback = '#8899aa') {
  if (typeof text !== 'string') return fallback;
  const match = text.match(HEX_COLOR_RE);
  return match ? `#${match[1]}` : fallback;
}

function resolvePaletteColorHex(colorName, charId) {
  const lc = String(colorName || '').toLowerCase();
  if (lc.includes('emerald') || lc.includes('mint')) return '#68C481';
  if (lc.includes('forest') || lc.includes('dark')) return '#438D5A';
  if (lc.includes('coral') || lc.includes('salmon')) return '#D6615D';
  if (lc.includes('yellow')) return '#E4D17C';
  if (lc.includes('orange') || lc.includes('tangerine')) return '#EC9D41';
  if (lc.includes('cream') || lc.includes('ivory')) return '#EAD8B3';
  if (lc.includes('teal') || lc.includes('ocean')) return '#167B75';
  if (lc.includes('white')) return '#DCE0E5';
  if (lc.includes('black')) return '#1F2421';
  return charId === 'dragonite' ? '#EC9D41' : '#68C481';
}

function getCharacterSpec(charId) {
  const fromImport = CHARACTERS?.[charId];
  const fallbackYarn = FALLBACK_YARN[charId] || FALLBACK_YARN.sceptile;
  let yarnBreakdown = fallbackYarn;
  let totalEstimatedGrams = fallbackYarn.reduce((acc, y) => acc + y.grams, 0);

  if (Array.isArray(fromImport?.yarnBreakdown) && fromImport.yarnBreakdown.length > 0) {
    yarnBreakdown = fromImport.yarnBreakdown;
    totalEstimatedGrams = yarnBreakdown.reduce((acc, y) => acc + Number(y.grams || y.weightGrams || 0), 0);
  } else if (fromImport?.yarnBreakdown && Array.isArray(fromImport.yarnBreakdown.colors)) {
    totalEstimatedGrams = Number(fromImport.yarnBreakdown.totalEstimatedGrams || 0);
    yarnBreakdown = fromImport.yarnBreakdown.colors.map((c) => ({
      name: c.rolls ? `${c.color} (${c.rolls} gulung)` : c.color,
      hex: extractHexFromText(c.color, resolvePaletteColorHex(c.color, charId)),
      grams: Number(c.gramsUsed || c.grams || 0),
      usage: c.usage || ''
    }));
  }

  return {
    name: fromImport?.name || (charId === 'sceptile' ? 'Sceptile' : 'Dragonite'),
    yarnBreakdown,
    totalEstimatedGrams
  };
}

function getBomItems() {
  if (Array.isArray(BOM_COMPONENTS) && BOM_COMPONENTS.length > 0) {
    return BOM_COMPONENTS;
  }
  return FALLBACK_BOM;
}

function createStudioPedestalTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#15171a';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadiusCm = 24;
  const pxPerCm = (size * 0.48) / maxRadiusCm;

  for (let rCm = 2; rCm <= maxRadiusCm; rCm += 2) {
    ctx.beginPath();
    ctx.arc(cx, cy, rCm * pxPerCm, 0, Math.PI * 2);
    ctx.strokeStyle = rCm % 4 === 0 ? 'rgba(216, 163, 83, 0.20)' : 'rgba(220, 216, 208, 0.08)';
    ctx.lineWidth = rCm === 4 ? 2.5 : 1.25;
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(220, 216, 208, 0.10)';
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, size);
  ctx.moveTo(0, cy);
  ctx.lineTo(size, cy);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function formatIdr(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// =====================================================================
// Main Three.js Studio Scene Setup
// =====================================================================
const canvas = document.getElementById('studio-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#111214');

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 450);
camera.position.set(38, 30, 56);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 18.5, 0);
controls.minDistance = 12;
controls.maxDistance = 175;
controls.maxPolarAngle = Math.PI * 0.495;

// Balanced Warm Workbench Three-Point Lighting
const hemiLight = new THREE.HemisphereLight('#f2efe8', '#1d1f23', 0.90);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight('#fff4e4', 2.15);
keyLight.position.set(24, 42, 28);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 5;
keyLight.shadow.camera.far = 140;
const dShadow = 36;
keyLight.shadow.camera.left = -dShadow;
keyLight.shadow.camera.right = dShadow;
keyLight.shadow.camera.top = dShadow;
keyLight.shadow.camera.bottom = -dShadow;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight('#dce5ef', 0.86);
fillLight.position.set(-28, 22, 18);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight('#e6decb', 1.15);
rimLight.position.set(-14, 30, -34);
scene.add(rimLight);

// Studio Pedestal & Subtle 1 cm Grid at y = 0
const pedestalMat = new THREE.MeshStandardMaterial({
  map: createStudioPedestalTexture(),
  roughness: 0.80,
  metalness: 0.08
});
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(24, 24.6, 0.5, 72), pedestalMat);
pedestal.position.y = -0.25;
pedestal.receiveShadow = true;
scene.add(pedestal);

const gridHelper = new THREE.GridHelper(110, 110, '#2a2d33', '#191b1f');
gridHelper.position.y = -0.49;
scene.add(gridHelper);

// Build Character Assemblies & Dimension Guides
const texLib = createCrochetTextureLibrary();
const sceptileAssembly = buildCharacterTumblerAssembly('sceptile', texLib);
const dragoniteAssembly = buildCharacterTumblerAssembly('dragonite', texLib);
scene.add(sceptileAssembly.root);
scene.add(dragoniteAssembly.root);

const dimensionGuides = buildDimensionGuides();
scene.add(dimensionGuides);

// Reference GLTF Cache & Container
const gltfLoader = new GLTFLoader();
const refCache = new Map();
const refLoading = new Map();
const refContainer = new THREE.Group();
refContainer.name = 'ref-gltf-container';
scene.add(refContainer);

// Studio State
const state = {
  character: 'sceptile', // 'sceptile' | 'dragonite' | 'both'
  strap: 'short',        // 'short' | 'long' | 'both' | 'none'
  xray: false,
  bottleOnly: false,
  showDimensions: true,
  showRefGltf: false,
  autoRotate: false,
  activeCameraPreset: 'iso'
};

let cameraAnim = null;

function flyCameraTo(preset, instant = false) {
  state.activeCameraPreset = preset;
  document.querySelectorAll('[data-camera]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.camera === preset);
  });

  const isBoth = state.character === 'both';
  const hasRef = state.showRefGltf;

  // Center & distance auto-framing:
  // - Single without ref: x = 0, distScale = 1.0
  // - Single with ref: tumbler at 0, ref at +15 -> focusX = 7.5, distScale = 1.28
  // - Side-by-side without ref: tumours at -10 & +10 -> focusX = 0, distScale = 1.38
  // - Side-by-side WITH BOTH refs: refs at -23 & +23, tumblers at -10 & +10 -> focusX = 0, distScale = 1.92
  const focusX = !isBoth && hasRef ? 7.5 : 0;
  const distScale = isBoth
    ? hasRef
      ? 1.92
      : 1.38
    : hasRef
    ? 1.28
    : 1.0;

  let targetPos;
  let targetLook = new THREE.Vector3(focusX, 18.5, 0);

  switch (preset) {
    case 'front':
      targetPos = new THREE.Vector3(focusX, 19.0, 62 * distScale);
      break;
    case 'back':
      targetPos = new THREE.Vector3(focusX, 19.0, -62 * distScale);
      break;
    case 'left':
      targetPos = new THREE.Vector3(-62 * distScale, 19.0, 0);
      break;
    case 'right':
      targetPos = new THREE.Vector3(62 * distScale, 19.0, 0);
      break;
    case 'neck': {
      const neckX = isBoth ? -10 : 0;
      targetLook = new THREE.Vector3(neckX, 26.2, 0);
      targetPos = new THREE.Vector3(neckX + 11.5, 30.2, 18.5);
      break;
    }
    case 'iso':
    default:
      targetPos = new THREE.Vector3(focusX + 38 * distScale, 30 * distScale, 55 * distScale);
      break;
  }

  if (instant) {
    cameraAnim = null;
    camera.position.copy(targetPos);
    controls.target.copy(targetLook);
    controls.update();
    return;
  }

  cameraAnim = {
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    endPos: targetPos,
    endTarget: targetLook,
    progress: 0
  };
}

controls.addEventListener('start', () => {
  cameraAnim = null;
});

// =====================================================================
// Spec Rail Rendering (No Zone Tabs, Clear Construction & Yarn Info)
// =====================================================================
const refStatusChip = document.getElementById('ref-status');
const activeCharBadge = document.getElementById('active-char-badge');
const strapLengthBadge = document.getElementById('strap-length-badge');
const yarnTotalBadge = document.getElementById('yarn-total-badge');
const yarnBreakdownList = document.getElementById('yarn-breakdown-list');

function createYarnListItem(y, prefix = '') {
  const li = document.createElement('li');
  li.className = 'yarn-row';

  const left = document.createElement('div');
  left.className = 'yarn-row-main';

  const dot = document.createElement('span');
  dot.className = 'swatch-dot';
  dot.style.setProperty('--swatch-hex', y.hex || '#70b088');

  const copy = document.createElement('div');
  copy.className = 'yarn-copy';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'yarn-name';
  nameSpan.textContent = prefix ? `${prefix} — ${y.name || 'Polycherry D27'}` : y.name || 'Polycherry D27';
  copy.appendChild(nameSpan);

  if (y.usage) {
    const usageSpan = document.createElement('span');
    usageSpan.className = 'yarn-usage';
    usageSpan.textContent = y.usage;
    copy.appendChild(usageSpan);
  }

  left.append(dot, copy);

  const gramsSpan = document.createElement('span');
  gramsSpan.className = 'yarn-grams';
  const g = Number(y.grams || y.weightGrams || 0);
  gramsSpan.textContent = g > 0 ? `${g} g` : y.amount || '-';

  li.append(left, gramsSpan);
  return li;
}

function updateSpecRail() {
  const inspectChar = state.character === 'dragonite' ? 'dragonite' : 'sceptile';
  const activeAssembly = inspectChar === 'sceptile' ? sceptileAssembly : dragoniteAssembly;

  if (state.character === 'both') {
    activeCharBadge.textContent = 'Sceptile + Dragonite';
  } else {
    activeCharBadge.textContent = getCharacterSpec(inspectChar).name;
  }

  if (state.strap === 'short') {
    strapLengthBadge.textContent = `${activeAssembly.straps.shortLengthCm} cm`;
  } else if (state.strap === 'long') {
    strapLengthBadge.textContent = `${activeAssembly.straps.longLengthCm} cm`;
  } else if (state.strap === 'both') {
    strapLengthBadge.textContent = `${activeAssembly.straps.shortLengthCm} & ${activeAssembly.straps.longLengthCm} cm`;
  } else {
    strapLengthBadge.textContent = 'Case Only';
  }

  yarnBreakdownList.replaceChildren();
  if (state.character === 'both') {
    const scSpec = getCharacterSpec('sceptile');
    const drSpec = getCharacterSpec('dragonite');
    for (const y of scSpec.yarnBreakdown) {
      yarnBreakdownList.appendChild(createYarnListItem(y, 'Sceptile'));
    }
    for (const y of drSpec.yarnBreakdown) {
      yarnBreakdownList.appendChild(createYarnListItem(y, 'Dragonite'));
    }
    const combinedGrams = (scSpec.totalEstimatedGrams || 0) + (drSpec.totalEstimatedGrams || 0);
    yarnTotalBadge.textContent = combinedGrams > 0 ? `~${combinedGrams} g total` : `${PROJECT_SPECS?.gauge?.yarn || 'Polycherry D27'}`;
  } else {
    const spec = getCharacterSpec(inspectChar);
    for (const y of spec.yarnBreakdown) {
      yarnBreakdownList.appendChild(createYarnListItem(y));
    }
    yarnTotalBadge.textContent =
      spec.totalEstimatedGrams > 0
        ? `~${spec.totalEstimatedGrams} g`
        : `${PROJECT_SPECS?.gauge?.yarn || 'Polycherry D27'}`;
  }
}

// =====================================================================
// Reference GLTF Normalization & Simultaneous Side-by-Side Placement
// =====================================================================
async function getNormalizedRefModel(charId) {
  if (refCache.has(charId)) {
    return refCache.get(charId);
  }
  if (refLoading.has(charId)) {
    return refLoading.get(charId);
  }

  const promise = (async () => {
    const gltf = await gltfLoader.loadAsync(`./ref/${charId}/scene.gltf`);
    const model = gltf.scene;

    const rawBox = new THREE.Box3().setFromObject(model);
    const size = rawBox.getSize(new THREE.Vector3());
    const maxY = Math.max(size.y, 0.001);
    const scaleFactor = 28.0 / maxY;
    model.scale.setScalar(scaleFactor);
    model.updateMatrixWorld(true);

    const normBox = new THREE.Box3().setFromObject(model);
    const center = normBox.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= normBox.min.y; // Flush at y = 0

    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    const wrapper = new THREE.Group();
    wrapper.name = `ref-${charId}`;
    wrapper.add(model);
    refCache.set(charId, wrapper);
    return wrapper;
  })();

  refLoading.set(charId, promise);
  try {
    return await promise;
  } finally {
    refLoading.delete(charId);
  }
}

async function updateRefGltfDisplay() {
  refContainer.clear();
  if (!state.showRefGltf) {
    refStatusChip.hidden = true;
    return;
  }

  refStatusChip.hidden = false;

  if (state.character === 'both') {
    refStatusChip.textContent = 'Memuat kedua ref/sceptile & ref/dragonite/scene.gltf...';
    const currentCharMode = state.character;
    try {
      const [sceptileRef, dragoniteRef] = await Promise.all([
        getNormalizedRefModel('sceptile'),
        getNormalizedRefModel('dragonite')
      ]);
      if (!state.showRefGltf || state.character !== currentCharMode) return;

      sceptileRef.position.set(-23, 0, 0);
      sceptileRef.rotation.y = 0;
      dragoniteRef.position.set(23, 0, 0);
      dragoniteRef.rotation.y = 0;

      refContainer.add(sceptileRef);
      refContainer.add(dragoniteRef);
      refStatusChip.textContent = 'Ref Sceptile (x=-23) & Ref Dragonite (x=+23) — normalized 28 cm (CC-BY-4.0)';
    } catch (err) {
      refStatusChip.textContent = `Gagal memuat model referensi (${err.message})`;
    }
    return;
  }

  const targetChar = state.character;
  refStatusChip.textContent = `Memuat ref/${targetChar}/scene.gltf...`;
  try {
    const modelRef = await getNormalizedRefModel(targetChar);
    if (!state.showRefGltf || state.character !== targetChar) return;

    modelRef.position.set(15.0, 0, 0);
    modelRef.rotation.y = 0;
    refContainer.add(modelRef);
    refStatusChip.textContent = `Ref ${targetChar}/scene.gltf (CC-BY-4.0) — normalized 28 cm`;
  } catch (err) {
    refStatusChip.textContent = `Gagal memuat ref/${targetChar}/scene.gltf (${err.message})`;
  }
}

function applySceneVisibility() {
  if (state.character === 'sceptile') {
    sceptileAssembly.root.visible = true;
    sceptileAssembly.root.position.set(0, 0, 0);
    dragoniteAssembly.root.visible = false;
  } else if (state.character === 'dragonite') {
    dragoniteAssembly.root.visible = true;
    dragoniteAssembly.root.position.set(0, 0, 0);
    sceptileAssembly.root.visible = false;
  } else {
    sceptileAssembly.root.visible = true;
    sceptileAssembly.root.position.set(-10, 0, 0);
    dragoniteAssembly.root.visible = true;
    dragoniteAssembly.root.position.set(10, 0, 0);
  }

  sceptileAssembly.setStrapMode(state.strap);
  dragoniteAssembly.setStrapMode(state.strap);

  sceptileAssembly.setXRay(state.xray);
  dragoniteAssembly.setXRay(state.xray);

  sceptileAssembly.setBottleOnly(state.bottleOnly);
  dragoniteAssembly.setBottleOnly(state.bottleOnly);

  dimensionGuides.visible = state.showDimensions;
  dimensionGuides.position.x = state.character === 'both' ? -10 : 0;

  if (state.character === 'both') {
    pedestal.position.x = 0;
    pedestal.scale.set(state.showRefGltf ? 1.85 : 1.35, 1, 1.15);
  } else {
    pedestal.position.x = state.showRefGltf ? 7.5 : 0;
    pedestal.scale.set(state.showRefGltf ? 1.32 : 1.0, 1, 1.05);
  }

  updateRefGltfDisplay();
  updateSpecRail();
}

// =====================================================================
// Event Bindings
// =====================================================================
document.querySelectorAll('[data-character]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.character = btn.dataset.character;
    document.querySelectorAll('[data-character]').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    applySceneVisibility();
    flyCameraTo(state.activeCameraPreset);
  });
});

document.querySelectorAll('[data-strap]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.strap = btn.dataset.strap;
    document.querySelectorAll('[data-strap]').forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    applySceneVisibility();
  });
});

document.querySelectorAll('[data-camera]').forEach((btn) => {
  btn.addEventListener('click', () => {
    flyCameraTo(btn.dataset.camera);
  });
});

document.getElementById('btn-reset-view').addEventListener('click', () => {
  flyCameraTo('iso');
});

const autoRotateBtn = document.getElementById('btn-autorotate');
autoRotateBtn.addEventListener('click', () => {
  state.autoRotate = !state.autoRotate;
  controls.autoRotate = state.autoRotate;
  controls.autoRotateSpeed = 1.6;
  autoRotateBtn.classList.toggle('is-active', state.autoRotate);
  autoRotateBtn.setAttribute('aria-pressed', String(state.autoRotate));
});

function bindToggleButton(id, stateKey) {
  const el = document.getElementById(id);
  el.addEventListener('click', () => {
    state[stateKey] = !state[stateKey];
    el.classList.toggle('is-active', state[stateKey]);
    el.setAttribute('aria-pressed', String(state[stateKey]));
    applySceneVisibility();
    if (stateKey === 'showRefGltf') {
      flyCameraTo(state.activeCameraPreset);
    }
  });
}

bindToggleButton('toggle-xray', 'xray');
bindToggleButton('toggle-bottle-only', 'bottleOnly');
bindToggleButton('toggle-dimensions', 'showDimensions');
bindToggleButton('toggle-ref-gltf', 'showRefGltf');

function exportStudioPng() {
  renderer.render(scene, camera);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `crochet-tumbler-${state.character}-${state.strap}.png`;
  link.href = dataUrl;
  link.click();
}

document.getElementById('btn-export-png').addEventListener('click', exportStudioPng);
document.getElementById('rail-btn-export').addEventListener('click', exportStudioPng);

// =====================================================================
// Native Modals (BOM + Cara Kirim ke Perajut) + Light-Dismiss Fallback
// =====================================================================
const bomDialog = document.getElementById('bom-dialog');
const shareDialog = document.getElementById('share-dialog');
const bomTableBody = document.getElementById('bom-table-body');
const bomTotalIdr = document.getElementById('bom-total-idr');
let activeBomFilter = 'active';

function renderBomDialog() {
  const allItems = getBomItems();
  const filterKey =
    activeBomFilter === 'active'
      ? state.character === 'both'
        ? 'all'
        : state.character
      : activeBomFilter;

  const items = allItems.filter((item) => {
    if (filterKey === 'all' || !Array.isArray(item.appliesto)) return true;
    return item.appliesto.includes(filterKey);
  });

  bomTableBody.replaceChildren();
  let totalCost = 0;

  for (const item of items) {
    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = item.name || '-';

    const tdSpec = document.createElement('td');
    tdSpec.textContent = item.spec || '-';

    const tdFit = document.createElement('td');
    tdFit.textContent = item.fitNote || '-';

    const tdQty = document.createElement('td');
    tdQty.textContent = String(item.qtyPerCase ?? 1);

    const tdPrice = document.createElement('td');
    const price = Number(item.estPriceIdr || 0);
    totalCost += price;
    tdPrice.textContent = price > 0 ? formatIdr(price) : '-';

    const tdLink = document.createElement('td');
    if (item.shopeeUrl) {
      const a = document.createElement('a');
      a.className = 'shop-link';
      a.href = item.shopeeUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Cari di Shopee';
      tdLink.appendChild(a);
    } else {
      tdLink.textContent = '-';
    }

    tr.append(th, tdSpec, tdFit, tdQty, tdPrice, tdLink);
    bomTableBody.appendChild(tr);
  }

  bomTotalIdr.textContent = totalCost > 0 ? formatIdr(totalCost) : 'Lihat estimasi tiap item';
}

document.querySelectorAll('[data-bom-filter]').forEach((btn) => {
  btn.addEventListener('click', () => {
    activeBomFilter = btn.dataset.bomFilter;
    document.querySelectorAll('[data-bom-filter]').forEach((b) => {
      const isAct = b === btn;
      b.classList.toggle('is-active', isAct);
      b.setAttribute('aria-pressed', String(isAct));
    });
    renderBomDialog();
  });
});

function openBomDialog() {
  renderBomDialog();
  bomDialog.showModal();
}

function openShareDialog() {
  shareDialog.showModal();
}

document.getElementById('btn-open-bom').addEventListener('click', openBomDialog);
document.getElementById('rail-btn-bom').addEventListener('click', openBomDialog);
document.getElementById('btn-open-share').addEventListener('click', openShareDialog);
document.getElementById('rail-btn-share').addEventListener('click', openShareDialog);

// Light-dismiss fallback for browsers without native <dialog closedby="any">
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const isOutside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (e) => {
      pressedOutside = isOutside(e, dialog);
    });
    dialog.addEventListener('pointerup', (e) => {
      if (pressedOutside && isOutside(e, dialog)) {
        dialog.close();
      }
      pressedOutside = false;
    });
  }
}

// Responsive Resize Observer for Canvas
function handleResize() {
  const stage = canvas.parentElement;
  const w = Math.max(stage.clientWidth, 1);
  const h = Math.max(stage.clientHeight, 1);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

const resizeObserver = new ResizeObserver(handleResize);
resizeObserver.observe(canvas.parentElement);

// Render Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (cameraAnim) {
    cameraAnim.progress = Math.min(1, cameraAnim.progress + dt * 2.8);
    const t = 1 - Math.pow(1 - cameraAnim.progress, 3);
    camera.position.lerpVectors(cameraAnim.startPos, cameraAnim.endPos, t);
    controls.target.lerpVectors(cameraAnim.startTarget, cameraAnim.endTarget, t);
    if (cameraAnim.progress >= 1) {
      cameraAnim = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

// Initialize Studio
handleResize();
applySceneVisibility();
animate();

window.__studio = {
  state,
  camera,
  controls,
  flyCameraTo,
  sceptileAssembly,
  dragoniteAssembly
};
