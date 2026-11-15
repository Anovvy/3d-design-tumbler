import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  createCrochetTextureLibrary,
  buildCharacterTumblerAssembly,
  buildDimensionGuides
} from './models/crochet_builder.js';
import { PROJECT_SPECS, BOM_COMPONENTS, CHARACTERS } from './data/project_specs.js';

/**
 * Defensive fallback specification builders in case any optional field
 * in ./data/project_specs.js is omitted or shaped slightly differently.
 */
const FALLBACK_ZONES = {
  sceptile: [
    {
      id: 'zone-1',
      title: 'Zone 1: Alas Ganda & Penguat EVA Foam',
      heightRangeCm: '0.0 – 1.5 cm',
      diameterRangeCm: 'Ø 8.0 – 8.7 cm',
      stitches: '6 → 48 sc (Magic Ring + Increase)',
      rows: '8 putaran spiral + 1 BLO ridge',
      colors: [{ name: 'Forest Green Base', hex: '#4A7A5B' }],
      instructions:
        'Buat alas ganda dari 2 lingkaran sc berdiameter 8.4 cm. Sisipkan kepingan busa EVA 3 mm (Ø 7.7 cm) di antara kedua lapis alas lalu jahit mati sebelum naik ke dinding (BLO 48 sc) agar dasar tidak melendung saat menampung 1.3 kg.',
      reinforcementNote: 'Sisipan EVA foam 3 mm + alas ganda mencegah botol melesak ke bawah.'
    },
    {
      id: 'zone-2',
      title: 'Zone 2: Body Silinder + Sabuk Coral & Garis V Dada',
      heightRangeCm: '1.5 – 20.0 cm',
      diameterRangeCm: 'Ø 8.7 cm (pas botol 8.0 cm)',
      stitches: '48 – 50 sc per putaran',
      rows: '39 putaran (tapestry color-change)',
      colors: [
        { name: 'Sceptile Green', hex: '#73B88C' },
        { name: 'Coral Red Belt', hex: '#D66865' },
        { name: 'Forest Chest V-Band', hex: '#4A7A5B' }
      ],
      instructions:
        'Rajut sc rapat lurus 48–50 tusuk. Pada tinggi 7.0–9.5 cm (putaran 13–17), ganti benang penuh ke Coral Red (#D66865). Pada tinggi 16.0–17.5 cm (putaran 31–34), bentuk garis dada Forest Green dengan penurunan titik V di tengah depan.',
      reinforcementNote: 'Gunakan hakpen 3.5 mm dengan tension rapat agar tidak melar.'
    },
    {
      id: 'zone-3',
      title: 'Zone 3: Bahu Mengerucut & Ekspresi Wajah Sceptile',
      heightRangeCm: '20.0 – 25.5 cm',
      diameterRangeCm: 'Ø 8.7 cm → Ø 6.6 cm',
      stitches: '48 sc → 36 sc (decrease bertahap)',
      rows: '12 putaran shaping bahu',
      colors: [
        { name: 'Sceptile Green', hex: '#73B88C' },
        { name: 'Eye Yellow', hex: '#E6D37A' },
        { name: 'Crimson Eye Trim', hex: '#C64D4D' }
      ],
      instructions:
        'Kurangi secara bertahap (dec terdistribusi merata di 6 titik per 2 putaran) mengikuti bahu botol Cuculemon hingga sisa 36 sc pada tinggi 25.5 cm. Pasang aplikasi mata almond kuning + trim merah bawah + alis hijau tua di depan (+Z).',
      reinforcementNote: 'Fitting langsung pada botol sebelum mengunci jahitan mata agar simetris.'
    },
    {
      id: 'zone-4',
      title: 'Zone 4: Kerah Leher Drawstring, Tab Bahu & Metal D-Ring',
      heightRangeCm: '25.5 – 28.0 cm',
      diameterRangeCm: 'Ø 6.6 cm (leher botol 5.8 cm)',
      stitches: '36 sc + eyelet lubang tali + Collar Anchor Ring',
      rows: '6 putaran kerah + 2 tab vertikal (y = 20.5–26.2 cm)',
      colors: [
        { name: 'Sceptile Green', hex: '#73B88C' },
        { name: 'Forest Anchor Tab', hex: '#4A7A5B' },
        { name: 'Seed Bead Yellow', hex: '#E6D37A' }
      ],
      instructions:
        'Rajut kerah 36 sc yang memeluk leher Ø 5.8 cm tepat di bawah tutup Ø 6.5 cm. Buat casing tali serut di y = 26.8 cm (paracord 3 mm + cord lock 2 lubang). Jahit Collar Anchor Ring & 2 tab vertikal kanan-kiri turun ke y = 20.5 cm untuk memegang 2 Metal D-Ring 1.5 cm.',
      reinforcementNote: 'Beban 1.3 kg ditopang tab vertikal (5.7 cm panjang jahitan X-box), bukan 1 baris kerah saja.'
    },
    {
      id: 'zone-5',
      title: 'Zone 5: Ornamen 3D (6 Seed Punggung, Ekor Daun, Blade Lengan)',
      heightRangeCm: '2.0 – 20.0 cm (sisi & belakang)',
      diameterRangeCm: 'Proyeksi ekor ±7.5 cm',
      stitches: 'Amigurumi terpisah + jahit whip-stitch',
      rows: '6 biji kuning + 10 helai daun ekor + 4 blade lengan',
      colors: [
        { name: 'Back Seed Yellow', hex: '#E6D37A' },
        { name: 'Leaf Dark Green', hex: '#4A7A5B' },
        { name: 'Leaf Mid Green', hex: '#73B88C' }
      ],
      instructions:
        'Buat 6 biji punggung kuning oval (isi dakron padat) lalu jahit berpasangan 3 tingkat di punggung belakang. Rangkai batang ekor meruncing + 5 pasang helai daun bergerigi dua warna. Jahit lengan pendek + 2 bilah daun di kiri-kanan bawah tab tali.',
      reinforcementNote: 'Posisikan lengan sedikit ke depan agar tidak menghalangi tab tali & D-ring.'
    },
    {
      id: 'zone-6',
      title: 'Zone 6: Tali Lepas-Pasang (30 cm Pendek & 100 cm Panjang)',
      heightRangeCm: 'D-Ring y = 25.6 cm ke atas/samping',
      diameterRangeCm: 'Paracord Ø 1.1 cm / Strap 2.0 cm',
      stitches: 'Kepang Paracord 3-warna / Thermal Stitch 6 ch',
      rows: 'Panjang bersih 30 cm & 100 cm + 2 kait udang 1.5 cm',
      colors: [
        { name: 'Forest Paracord', hex: '#2F593D' },
        { name: 'Leaf Paracord', hex: '#73B88C' },
        { name: 'Coral Wrap Cuff', hex: '#D66865' }
      ],
      instructions:
        'Tali Pendek 30 cm: kepang paracord 3 warna dengan lilitan cuff benang merah coral di kedua ujung sebelum mengunci kait udang swivel 1.5 cm. Tali Panjang 100 cm: rajut Thermal Stitch selebar 2.0 cm (tahan melar) dengan inti paracord di kedua ujung kait.',
      reinforcementNote: 'Thermal Stitch double-thickness menahan 1.3 kg tanpa mulur permanen.'
    }
  ],
  dragonite: [
    {
      id: 'zone-1',
      title: 'Zone 1: Alas Ganda Oker & Kepingan EVA Foam',
      heightRangeCm: '0.0 – 1.5 cm',
      diameterRangeCm: 'Ø 8.0 – 8.7 cm',
      stitches: '6 → 48 sc (Magic Ring + Increase)',
      rows: '8 putaran spiral + 1 BLO ridge',
      colors: [{ name: 'Deep Ochre Base', hex: '#B56B22' }],
      instructions:
        'Rajut alas ganda berwarna jingga-oker tua (#B56B22) dengan kepingan busa EVA 3 mm di dalamnya. Tambahkan punggung BLO pada putaran ke-8 agar bentuk tabung bawah berdiri kokoh di meja.',
      reinforcementNote: 'Alas keras menjaga posisi cakar kaki depan tetap sejajar permukaan.'
    },
    {
      id: 'zone-2',
      title: 'Zone 2: Body Jingga Emas + Panel Perut Cream Bergaris',
      heightRangeCm: '1.5 – 20.0 cm',
      diameterRangeCm: 'Ø 8.7 cm (pas botol 8.0 cm)',
      stitches: '48 – 50 sc per putaran',
      rows: '39 putaran + jahitan garis rusuk perut',
      colors: [
        { name: 'Golden Orange', hex: '#E29338' },
        { name: 'Belly Cream', hex: '#DDD0A8' },
        { name: 'Belly Rib Tan', hex: '#BFA97A' }
      ],
      instructions:
        'Rajut tabung utama jingga emas (#E29338). Bentuk panel perut oval cream (#DDD0A8) di sisi depan (+Z) menggunakan teknik intarsia/tapestry atau panel tempel, lalu jahit garis horizontal cream tua (#BFA97A) tiap 1.6 cm.',
      reinforcementNote: 'Jahitan garis rusuk horizontal membantu menstabilkan elastisitas bagian depan.'
    },
    {
      id: 'zone-3',
      title: 'Zone 3: Bahu Mengerucut, Mata Oval & Moncong Lembut',
      heightRangeCm: '20.0 – 25.5 cm',
      diameterRangeCm: 'Ø 8.7 cm → Ø 6.6 cm',
      stitches: '48 sc → 36 sc (decrease bertahap)',
      rows: '12 putaran shaping bahu',
      colors: [
        { name: 'Golden Orange', hex: '#E29338' },
        { name: 'Olive Iris', hex: '#676E4E' }
      ],
      instructions:
        'Kecilkan keliling secara bertahap mengikuti bahu botol Cuculemon hingga 36 sc. Pasang mata oval putih-zaitun ramah di sisi kiri-kanan atas dan jahit moncong bulat jingga dengan isi dakron ringan + bordir lubang hidung & senyum.',
      reinforcementNote: 'Isi dakron secukupnya pada moncong agar profil depan tidak berat sebelah.'
    },
    {
      id: 'zone-4',
      title: 'Zone 4: Kerah Leher, Antena Cream, Cula Kecil & D-Ring',
      heightRangeCm: '25.5 – 28.0 cm (antena hingga 30.8 cm)',
      diameterRangeCm: 'Ø 6.6 cm (leher botol 5.8 cm)',
      stitches: '36 sc + kawat lentur di dalam 2 antena',
      rows: '6 putaran kerah + 2 tab vertikal',
      colors: [
        { name: 'Golden Orange', hex: '#E29338' },
        { name: 'Antenna Cream', hex: '#DDD0A8' }
      ],
      instructions:
        'Rajut kerah pas leher Ø 5.8 cm dengan tali serut paracord di y = 26.8 cm & cord lock. Pasang 2 antena cream (isi kawat kraft lunak) dan 1 cula kecil jingga tepat di bibir depan rim (y = 27.6 cm) agar tutup botol hitam Ø 6.5 cm bebas diputar!',
      reinforcementNote: 'Tab beban vertikal X-box menjamin antena/kerah tidak tertarik beban botol.'
    },
    {
      id: 'zone-5',
      title: 'Zone 5: Sayap Teal-Jingga, Ekor Tebal, Lengan & Kaki Cakar',
      heightRangeCm: '0.0 – 22.5 cm (punggung & kaki bawah)',
      diameterRangeCm: 'Lebar sayap ±13 cm',
      stitches: 'Sayap rangka kawat lembut + ekor kerucut bergaris',
      rows: '2 sayap + 1 ekor + 2 lengan + 2 kaki (3 cakar putih)',
      colors: [
        { name: 'Deep Teal Wing', hex: '#146B62' },
        { name: 'Golden Orange', hex: '#E29338' },
        { name: 'Claw White', hex: '#ECECEC' }
      ],
      instructions:
        'Buat sepasang sayap dengan membran dalam teal tua (#146B62) dan tulang luar jingga (#E29338). Rajut ekor gemuk melengkung dengan garis bawah cream, plus lengan mungil & kaki bawah masing-masing dengan 3 cakar kerucut putih (#ECECEC).',
      reinforcementNote: 'Kaki depan dipasang rata di y = 0 cm agar ikut menjaga keseimbangan saat berdiri.'
    },
    {
      id: 'zone-6',
      title: 'Zone 6: Tali Lepas-Pasang (30 cm Twisted & 100 cm Crossbody)',
      heightRangeCm: 'D-Ring y = 25.6 cm ke atas/samping',
      diameterRangeCm: 'Paracord Ø 1.1 cm / Strap 2.0 cm',
      stitches: 'Kepang 3-warna / Thermal Stitch 6 ch',
      rows: '30 cm (pendek) & 100 cm (panjang) + 2 kait udang 1.5 cm',
      colors: [
        { name: 'Golden Orange', hex: '#E29338' },
        { name: 'Teal Accent', hex: '#146B62' },
        { name: 'Cream Cuff', hex: '#DDD0A8' }
      ],
      instructions:
        'Tali Pendek 30 cm: kepang paracord jingga-teal-cream dengan lilitan cuff cream bergaris di dekat kait udang 1.5 cm. Tali Panjang 100 cm: rajut Thermal Stitch jingga-oker datar bebas melar dengan ujung paracord ke kait udang.',
      reinforcementNote: 'Kait udang swivel berputar 360° agar tali panjang tidak terpuntir.'
    }
  ]
};

const FALLBACK_YARN = {
  sceptile: [
    { name: 'Sceptile Leaf Green (#73B88C)', hex: '#73B88C', grams: 85 },
    { name: 'Forest Dark Green (#4A7A5B)', hex: '#4A7A5B', grams: 55 },
    { name: 'Coral Red Belt & Cuff (#D66865)', hex: '#D66865', grams: 20 },
    { name: 'Seed & Eye Yellow (#E6D37A)', hex: '#E6D37A', grams: 25 }
  ],
  dragonite: [
    { name: 'Golden Orange (#E29338)', hex: '#E29338', grams: 110 },
    { name: 'Cream Belly & Antennae (#DDD0A8)', hex: '#DDD0A8', grams: 35 },
    { name: 'Deep Ochre Base (#B56B22)', hex: '#B56B22', grams: 25 },
    { name: 'Deep Teal Wing (#146B62)', hex: '#146B62', grams: 20 }
  ]
};

const FALLBACK_BOM = [
  {
    name: 'Metal D-Ring Heavy Duty (1.5 cm)',
    spec: 'Lebar dalam 15 mm, ketebalan kawat 3 mm, steel/gunmetal',
    fitNote: 'Masuk ke tab penguat bahu y = 24.4 cm (beban tarik > 5 kg)',
    qtyPerCase: 2,
    estPriceIdr: 3500,
    shopeeUrl: 'https://shopee.co.id/search?keyword=ring+D+besi+1.5cm+tebal'
  },
  {
    name: 'Kait Udang Putar / Swivel Lobster Clasp',
    spec: 'Lebar lubang tali 15 mm, panjang total ~38 mm',
    fitNote: 'Pas dengan D-Ring 1.5 cm untuk tali 30 cm & 100 cm',
    qtyPerCase: 4,
    estPriceIdr: 4500,
    shopeeUrl: 'https://shopee.co.id/search?keyword=kait+udang+tas+1.5cm+tebal'
  },
  {
    name: 'Cord Lock / Stopper Tali 2 Lubang',
    spec: 'Plastik POM pegas kuat, lubang Ø 4.5 mm',
    fitNote: 'Mengunci tali serut leher Ø 5.8 cm agar case tidak merosot',
    qtyPerCase: 1,
    estPriceIdr: 2000,
    shopeeUrl: 'https://shopee.co.id/search?keyword=stopper+tali+serut+2+lubang'
  },
  {
    name: 'Tali Paracord 550 (3–4 mm)',
    spec: 'Nylon 7-strand core (tahan > 100 kg)',
    fitNote: 'Drawstring leher (~45 cm) + kepang tali pendek 30 cm',
    qtyPerCase: '2 meter',
    estPriceIdr: 8000,
    shopeeUrl: 'https://shopee.co.id/search?keyword=tali+paracord+4mm'
  },
  {
    name: 'Busa EVA / Sponge Foam 3 mm',
    spec: 'Lembaran EVA padat potong bulat Ø 7.7 cm',
    fitNote: 'Diselipkan di dalam alas ganda (Zone 1) untuk topangan 1.3 kg',
    qtyPerCase: 1,
    estPriceIdr: 3000,
    shopeeUrl: 'https://shopee.co.id/search?keyword=busa+ati+eva+foam+3mm'
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
  const fallbackZones = FALLBACK_ZONES[charId] || FALLBACK_ZONES.sceptile;
  const fallbackYarn = FALLBACK_YARN[charId] || FALLBACK_YARN.sceptile;

  const zones = Array.isArray(fromImport?.zones) && fromImport.zones.length > 0
    ? fromImport.zones.map((z, idx) => ({
        ...fallbackZones[idx],
        ...z
      }))
    : fallbackZones;

  let yarnBreakdown = fallbackYarn;
  let totalEstimatedGrams = 0;

  if (Array.isArray(fromImport?.yarnBreakdown) && fromImport.yarnBreakdown.length > 0) {
    yarnBreakdown = fromImport.yarnBreakdown;
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
    zones,
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

/**
 * Generates a crisp circular craft-mat pedestal texture with 1 cm measurement rings.
 */
function createStudioPedestalTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#141b24';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadiusCm = 22;
  const pxPerCm = (size * 0.48) / maxRadiusCm;

  // Radial craft mat rings every 2 cm, brighter every 4 cm
  for (let rCm = 2; rCm <= maxRadiusCm; rCm += 2) {
    ctx.beginPath();
    ctx.arc(cx, cy, rCm * pxPerCm, 0, Math.PI * 2);
    ctx.strokeStyle = rCm % 4 === 0 ? 'rgba(232, 168, 73, 0.25)' : 'rgba(180, 200, 224, 0.11)';
    ctx.lineWidth = rCm === 4 ? 3 : 1.5; // Ø 8 cm tumbler footprint ring highlighted!
    ctx.stroke();
  }

  // Orthogonal crosshairs
  ctx.strokeStyle = 'rgba(180, 200, 224, 0.14)';
  ctx.lineWidth = 1.5;
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
// Main Studio Application Bootstrap
// =====================================================================
const canvas = document.getElementById('studio-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true, // Required for instant PNG screenshot export
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0c1118');

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
camera.position.set(39, 31, 56);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 19.0, 0);
controls.minDistance = 12;
controls.maxDistance = 140;
controls.maxPolarAngle = Math.PI * 0.495; // Keeps camera neatly above studio table y=0

// Three-Point Studio Lighting
const hemiLight = new THREE.HemisphereLight('#dfeaf8', '#1a2029', 0.88);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight('#fff5e6', 2.15);
keyLight.position.set(24, 42, 28);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 5;
keyLight.shadow.camera.far = 120;
const dShadow = 32;
keyLight.shadow.camera.left = -dShadow;
keyLight.shadow.camera.right = dShadow;
keyLight.shadow.camera.top = dShadow;
keyLight.shadow.camera.bottom = -dShadow;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight('#cce4ff', 0.85);
fillLight.position.set(-28, 22, 18);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight('#8de2cf', 1.25);
rimLight.position.set(-14, 30, -34);
scene.add(rimLight);

// Studio Pedestal & 1 cm Measurement Grid at y = 0
const pedestalMat = new THREE.MeshStandardMaterial({
  map: createStudioPedestalTexture(),
  roughness: 0.78,
  metalness: 0.08
});
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(23, 23.6, 0.5, 72), pedestalMat);
pedestal.position.y = -0.25;
pedestal.receiveShadow = true;
scene.add(pedestal);

const gridHelper = new THREE.GridHelper(90, 90, '#2a3646', '#161e29');
gridHelper.position.y = -0.49;
scene.add(gridHelper);

// Build Shared Procedural Texture Library & Both Character Assemblies
const texLib = createCrochetTextureLibrary();
const sceptileAssembly = buildCharacterTumblerAssembly('sceptile', texLib);
const dragoniteAssembly = buildCharacterTumblerAssembly('dragonite', texLib);
scene.add(sceptileAssembly.root);
scene.add(dragoniteAssembly.root);

const dimensionGuides = buildDimensionGuides();
scene.add(dimensionGuides);

// Reference GLTF Loader Cache
const gltfLoader = new GLTFLoader();
const refCache = new Map();
const refContainer = new THREE.Group();
refContainer.name = 'ref-gltf-container';
scene.add(refContainer);

// Studio State
const state = {
  character: 'sceptile', // 'sceptile' | 'dragonite' | 'both'
  strap: 'short',        // 'short' | 'long' | 'both' | 'none'
  activeZone: 'zone-1',
  xray: false,
  bottleOnly: false,
  showDimensions: true,
  showRefGltf: false,
  autoRotate: false,
  activeCameraPreset: 'iso'
};

// Smooth Camera Transition State
let cameraAnim = null;

function flyCameraTo(preset, instant = false) {
  state.activeCameraPreset = preset;
  document.querySelectorAll('[data-camera]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.camera === preset);
  });

  const isBoth = state.character === 'both';
  const focusX = state.showRefGltf && !isBoth ? 6.5 : 0;
  const distScale = isBoth ? 1.38 : state.showRefGltf ? 1.24 : 1.0;

  let targetPos;
  let targetLook = new THREE.Vector3(focusX, 19.0, 0);

  switch (preset) {
    case 'front':
      targetPos = new THREE.Vector3(focusX, 19.5, 64 * distScale);
      break;
    case 'back':
      targetPos = new THREE.Vector3(focusX, 19.5, -64 * distScale);
      break;
    case 'left':
      targetPos = new THREE.Vector3(-64 * distScale, 19.5, 0);
      break;
    case 'right':
      targetPos = new THREE.Vector3(64 * distScale, 19.5, 0);
      break;
    case 'neck': {
      const neckX = isBoth ? -12.5 : 0;
      targetLook = new THREE.Vector3(neckX, 25.6, 0);
      targetPos = new THREE.Vector3(neckX + 12.5, 29.8, 19.5);
      break;
    }
    case 'iso':
    default:
      targetPos = new THREE.Vector3(focusX + 39 * distScale, 31 * distScale, 56 * distScale);
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

// UI DOM References
const hoverReadout = document.getElementById('hover-readout');
const refStatusChip = document.getElementById('ref-status');
const activeCharBadge = document.getElementById('active-char-badge');
const strapLengthBadge = document.getElementById('strap-length-badge');
const yarnTotalBadge = document.getElementById('yarn-total-badge');
const yarnBreakdownList = document.getElementById('yarn-breakdown-list');
const zoneTabpanel = document.getElementById('zone-tabpanel');
const zoneTabs = Array.from(document.querySelectorAll('.zone-tab'));

function updateInspectorUI() {
  const inspectChar = state.character === 'dragonite' ? 'dragonite' : 'sceptile';
  const charSpec = getCharacterSpec(inspectChar);

  activeCharBadge.textContent =
    state.character === 'both' ? 'Sceptile + Dragonite' : charSpec.name;

  // Update strap length badge with actual measured Three.js curve lengths
  const activeAssembly = inspectChar === 'sceptile' ? sceptileAssembly : dragoniteAssembly;
  if (state.strap === 'short') {
    strapLengthBadge.textContent = `${activeAssembly.straps.shortLengthCm} cm`;
  } else if (state.strap === 'long') {
    strapLengthBadge.textContent = `${activeAssembly.straps.longLengthCm} cm`;
  } else if (state.strap === 'both') {
    strapLengthBadge.textContent = `${activeAssembly.straps.shortLengthCm} & ${activeAssembly.straps.longLengthCm} cm`;
  } else {
    strapLengthBadge.textContent = 'Case Only';
  }

  // Render active zone data
  const zoneData =
    charSpec.zones.find((z) => z.id === state.activeZone) || charSpec.zones[0];
  document.getElementById('zone-title').textContent = zoneData.title;
  document.getElementById('zone-height').textContent = zoneData.heightRangeCm || '-';
  document.getElementById('zone-diameter').textContent = zoneData.diameterRangeCm || '-';
  document.getElementById('zone-stitches').textContent = zoneData.stitches || '-';
  document.getElementById('zone-rows').textContent = zoneData.rows || '-';
  document.getElementById('zone-reinforce-text').textContent =
    zoneData.loadBearingNote ||
    zoneData.reinforcementNote ||
    'Gunakan hakpen 3.0 mm rapat agar tidak melar saat botol terisi penuh 1.3 kg.';

  // Render instructions cleanly as ordered steps
  const instList = document.getElementById('zone-instructions');
  instList.replaceChildren();
  const steps = Array.isArray(zoneData.instructions)
    ? zoneData.instructions
    : [String(zoneData.instructions || '-')];
  for (const stepText of steps) {
    const li = document.createElement('li');
    li.textContent = stepText;
    instList.appendChild(li);
  }

  // Render swatches safely (extracting #HEX from strings like "Mint Green (#68C481)")
  const swatchList = document.getElementById('zone-colors');
  swatchList.replaceChildren();
  for (const col of zoneData.colors || []) {
    const li = document.createElement('li');
    li.className = 'swatch-pill';
    const dot = document.createElement('span');
    dot.className = 'swatch-dot';
    const hex = typeof col === 'string' ? extractHexFromText(col, '#73B88C') : col.hex || '#888';
    dot.style.setProperty('--swatch-hex', hex);
    const label = document.createElement('span');
    label.textContent = typeof col === 'string' ? col : `${col.name} (${col.hex})`;
    li.append(dot, label);
    swatchList.appendChild(li);
  }

  // Render Yarn Breakdown
  yarnBreakdownList.replaceChildren();
  let totalGrams = 0;
  for (const y of charSpec.yarnBreakdown) {
    const g = Number(y.grams || y.weightGrams || 0);
    totalGrams += g;
    const li = document.createElement('li');
    li.className = 'yarn-row';

    const left = document.createElement('span');
    left.className = 'yarn-row-left';
    const dot = document.createElement('span');
    dot.className = 'swatch-dot';
    dot.style.setProperty('--swatch-hex', y.hex || '#73B88C');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = y.name || y.color || 'Polycherry D27';
    if (y.usage) nameSpan.title = y.usage;
    left.append(dot, nameSpan);

    const gramsSpan = document.createElement('span');
    gramsSpan.className = 'yarn-grams';
    gramsSpan.textContent = g > 0 ? `${g} g` : y.amount || '-';

    li.append(left, gramsSpan);
    yarnBreakdownList.appendChild(li);
  }
  const finalGrams = charSpec.totalEstimatedGrams || totalGrams;
  yarnTotalBadge.textContent = finalGrams > 0 ? `~${finalGrams} g` : `${PROJECT_SPECS?.gauge?.yarn || 'Polycherry D27'}`;
}

function selectZone(zoneId, highlightIn3D = true) {
  state.activeZone = zoneId;

  for (const tab of zoneTabs) {
    const isSel = tab.dataset.zone === zoneId;
    tab.setAttribute('aria-selected', String(isSel));
    tab.tabIndex = isSel ? 0 : -1;
    if (isSel) {
      zoneTabpanel.setAttribute('aria-labelledby', tab.id);
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  const hl = highlightIn3D ? zoneId : null;
  sceptileAssembly.highlightZone(hl);
  dragoniteAssembly.highlightZone(hl);
  updateInspectorUI();
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
    sceptileAssembly.root.position.set(-12.5, 0, 0);
    dragoniteAssembly.root.visible = true;
    dragoniteAssembly.root.position.set(12.5, 0, 0);
  }

  sceptileAssembly.setStrapMode(state.strap);
  dragoniteAssembly.setStrapMode(state.strap);

  sceptileAssembly.setXRay(state.xray);
  dragoniteAssembly.setXRay(state.xray);

  sceptileAssembly.setBottleOnly(state.bottleOnly);
  dragoniteAssembly.setBottleOnly(state.bottleOnly);

  dimensionGuides.visible = state.showDimensions;
  dimensionGuides.position.x = state.character === 'both' ? -12.5 : 0;

  pedestal.scale.set(state.character === 'both' ? 1.48 : 1.0, 1, state.character === 'both' ? 1.25 : 1.0);

  updateRefGltfDisplay();
  updateInspectorUI();
}

async function updateRefGltfDisplay() {
  refContainer.clear();
  if (!state.showRefGltf) {
    refStatusChip.hidden = true;
    return;
  }

  const targetChar = state.character === 'dragonite' ? 'dragonite' : 'sceptile';
  refStatusChip.hidden = false;

  if (refCache.has(targetChar)) {
    const cached = refCache.get(targetChar);
    cached.position.x = state.character === 'both' ? 34.0 : 16.5;
    refContainer.add(cached);
    refStatusChip.textContent = `Ref ${targetChar}/scene.gltf (CC-BY-4.0) — dinormalisasi 28 cm`;
    return;
  }

  refStatusChip.textContent = `Memuat ref/${targetChar}/scene.gltf...`;
  try {
    const gltf = await gltfLoader.loadAsync(`./ref/${targetChar}/scene.gltf`);
    if (!state.showRefGltf) return;

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
    wrapper.add(model);
    refCache.set(targetChar, wrapper);

    if (state.showRefGltf && (state.character === targetChar || state.character === 'both')) {
      wrapper.position.x = state.character === 'both' ? 34.0 : 16.5;
      refContainer.add(wrapper);
      refStatusChip.textContent = `Ref ${targetChar}/scene.gltf (CC-BY-4.0) — dinormalisasi 28 cm`;
    }
  } catch (err) {
    refStatusChip.textContent = `Gagal memuat ref/${targetChar}/scene.gltf (${err.message})`;
  }
}

// =====================================================================
// Event Listeners (Character, Straps, Helpers, Camera, Tabs, Raycast)
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

document.getElementById('btn-clear-highlight').addEventListener('click', () => {
  sceptileAssembly.highlightZone(null);
  dragoniteAssembly.highlightZone(null);
  hoverReadout.textContent = 'Sorotan zona dilepas. Klik bagian 3D mana saja untuk inspeksi ulang.';
});

// Accessible WAI-ARIA Tablist interaction (click + ArrowLeft/ArrowRight/Home/End)
zoneTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    selectZone(tab.dataset.zone, true);
  });

  tab.addEventListener('keydown', (e) => {
    let nextIdx = null;
    if (e.key === 'ArrowRight') nextIdx = (index + 1) % zoneTabs.length;
    else if (e.key === 'ArrowLeft') nextIdx = (index - 1 + zoneTabs.length) % zoneTabs.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = zoneTabs.length - 1;

    if (nextIdx !== null) {
      e.preventDefault();
      const targetTab = zoneTabs[nextIdx];
      targetTab.focus();
      selectZone(targetTab.dataset.zone, true);
    }
  });
});

// Raycasting Click-to-Inspect & Hover
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let downPointer = null;

function getRaycastTargets() {
  const targets = [];
  if (sceptileAssembly.root.visible) targets.push(sceptileAssembly.caseGroup);
  if (dragoniteAssembly.root.visible) targets.push(dragoniteAssembly.caseGroup);
  return targets;
}

function findZoneHit(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(getRaycastTargets(), true);
  return hits.find((h) => h.object?.visible && h.object?.userData?.zoneId) || null;
}

canvas.addEventListener('pointerdown', (e) => {
  downPointer = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointermove', (e) => {
  if (e.buttons !== 0) return;
  const hit = findZoneHit(e.clientX, e.clientY);
  if (hit) {
    canvas.style.cursor = 'pointer';
    hoverReadout.textContent = `Bagian: ${hit.object.userData.partName} (${hit.object.userData.zoneId.toUpperCase()})`;
  } else {
    canvas.style.cursor = 'grab';
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (!downPointer) return;
  const dist = Math.hypot(e.clientX - downPointer.x, e.clientY - downPointer.y);
  downPointer = null;
  if (dist > 5) return; // Ignore orbit drag

  const hit = findZoneHit(e.clientX, e.clientY);
  if (hit) {
    const { zoneId, partName } = hit.object.userData;
    selectZone(zoneId, true);
    hoverReadout.textContent = `Terpilih: ${partName} — lihat detail pola & dimensi di panel kanan.`;
  }
});

// Export PNG Screenshot (guaranteed non-blank with preserveDrawingBuffer: true)
document.getElementById('btn-export-png').addEventListener('click', () => {
  renderer.render(scene, camera);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `crochet-tumbler-${state.character}-${state.strap}.png`;
  link.href = dataUrl;
  link.click();
});

// Native Modal Dialog for BOM & Shopee Links
const bomDialog = document.getElementById('bom-dialog');
const bomTableBody = document.getElementById('bom-table-body');
const bomTotalIdr = document.getElementById('bom-total-idr');
let activeBomFilter = 'active'; // 'active' | 'sceptile' | 'dragonite' | 'all'

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

document.getElementById('btn-open-bom').addEventListener('click', () => {
  renderBomDialog();
  bomDialog.showModal();
});

// Light-dismiss fallback for browsers without native <dialog closedby="any">
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const isOutside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  let pressedOutside = false;
  bomDialog.addEventListener('pointerdown', (e) => {
    pressedOutside = isOutside(e, bomDialog);
  });
  bomDialog.addEventListener('pointerup', (e) => {
    if (pressedOutside && isOutside(e, bomDialog)) {
      bomDialog.close();
    }
    pressedOutside = false;
  });
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
    const t = 1 - Math.pow(1 - cameraAnim.progress, 3); // Ease-out cubic
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
selectZone('zone-1', false);
animate();

window.__studio = {
  state,
  camera,
  controls,
  flyCameraTo,
  selectZone,
  sceptileAssembly,
  dragoniteAssembly
};
