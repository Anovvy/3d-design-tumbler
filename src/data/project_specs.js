/**
 * Master Product Specification, Simplified Silicone Neck Ring Load Engineering,
 * Component-Only Shopee BOM (15 items, NO TOOLS), and Zone-by-Zone Crochet Pattern Specs
 * for the Sceptile & Dragonite 1L Tumbler Case.
 *
 * Target Tumbler: Cuculemon 1L Stainless Steel (Gambar 3, 4, 5: Ø 8.0 cm body, 0-21.5 cm barrel,
 *   21.5-24.8 cm convex dome shoulder, 24.8-27.8 cm vertical neck Ø 5.6-5.8 cm, 27.8-32.0 cm cap/spout/side loop)
 * Design Load: 1.3 kg full weight (>= 3x safety factor => >= 4.0 kg tensile target; achieved ~11.5x)
 */

export const PROJECT_SPECS = {
  projectName: "Sceptile & Dragonite 1L Heavy-Duty Crochet Tumbler Bag",
  version: "2.0.0",
  tumblerDimensions: {
    model: "Cuculemon 1L Stainless Steel Tumbler (Gambar 3, 4, 5 Reference)",
    capacityLiters: 1.0,
    material:
      "Stainless Steel (Besi SUS 304) with Black Screw Cap & Side Teardrop Carry Loop",
    bodyDiameterCm: 8.0,
    bodyCircumferenceCm: 25.13,
    totalHeightWithLidCm: 32.0,
    crochetCaseHeightCm: 27.8,
    exposedLidHandleRangeCm: "27.8 - 32.0",
    neckHeightRangeCm: "24.8 - 27.8",
    neckDiameterMinCm: 5.6,
    neckDiameterMaxCm: 5.8,
    neckCircumferenceRangeCm: "17.6 - 18.2",
    capFlangeDiameterCm: 6.0,
    sideCarryLoopRangeCm: "24.5 - 30.6",
    profileZones: [
      {
        zone: "Base",
        heightCm: "0.0 - 0.8",
        diameterCm: "8.0",
        note: "Flat Ø 8.0 cm stainless steel bottom supported internally by a Ø 7.8 cm × 4 mm EVA foam disk inside Zone 1 double base",
      },
      {
        zone: "Straight Body",
        heightCm: "0.0 - 21.5",
        diameterCm: "8.0",
        note: "Straight cylindrical barrel (circumference 25.13 cm) hugged tightly by Zone 2 crochet wall",
      },
      {
        zone: "Rounded Convex Dome Shoulder",
        heightCm: "21.5 - 24.8",
        diameterCm: "8.0 -> 5.7",
        note: "Smooth 3.3 cm convex dome shoulder curving from Ø 8.0 cm barrel to Ø 5.6-5.7 cm neck",
      },
      {
        zone: "Vertical Neck",
        heightCm: "24.8 - 27.8",
        diameterCm: "5.6 - 5.8",
        note: "3.0 cm vertical neck (black lower band + brushed silver upper stainless collar); holds woven drawstring at 25.4-26.2 cm and Silicone Neck Ring at 26.6-27.8 cm",
      },
      {
        zone: "Exposed Cap, Flip-Straw Spout & Side Carry Loop",
        heightCm: "27.8 - 32.0",
        diameterCm: "~6.0",
        note: "Black screw cap (Ø ~6.0 cm), recessed top flip-straw spout, and side-hinged black teardrop carry loop hanging beside neck (24.5-30.6 cm) — left unobstructed",
      },
    ],
  },
  loadEngineering: {
    emptyTumblerWeightKg: 0.35,
    liquidLoadWeightKg: 0.95,
    designFullWeightKg: 1.3,
    designStaticForceN: 12.75,
    minimumSafetyFactor: 3.0,
    minimumRequiredTensileRatingKg: 4.0,
    systemWeakestLinkRatingKg: 15.0,
    achievedSafetyFactor:
      "11.5x (exceeds >= 3x / >= 4.0 kg requirement by nearly 4x margin)",
    componentStrengthRatings: {
      siliconeNeckRing:
        "Heavy-duty molded elastic silicone collar ring (ID 5.5-5.8 cm, stretches 5.5-6.2 cm) with 2 molded side ear loops; > 15 kg pull/tear rating when locked on Ø 5.7 cm neck under Ø ~6.0 cm screw cap flange",
      paracord550Core4mm:
        "249 kg (550 lbs) breaking strength / ~50 kg safe working load",
      swivelClasp15mm:
        "> 22 kg static load (zinc alloy/iron heavy-duty), clips directly into Silicone Ring side ear loops",
      polycherryCollarTackingAndDrawstring:
        "4 Polycherry whip-stitch tacking loops + woven 4mm Paracord 550 drawstring lock crochet case onto Silicone Ring & bottle neck (> 15 kg downward shear support)",
    },
    antiSagAndAntiSlipControls: [
      "Wide-Mouth Silicone Tumbler Neck Ring (ID 5.5-5.8 cm) seats directly in the upper vertical neck groove (y = 26.6-27.8 cm) beneath the wider Ø ~6.0 cm black screw cap flange, carrying the 1.3 kg bottle load directly without metal D-rings or webbing tabs.",
      "The Silicone Ring and upper crochet collar (y = 26.2-27.8 cm, worked to Ø 5.8 cm with 2 side cutouts for the silicone ear loops) are united as one piece using 4 simple Polycherry whip-stitch/tacking loops (front, back, left, right) over the silicone ring's bottom lip.",
      "Directly below the Silicone Ring (y = 25.4-26.2 cm), a 4mm Paracord 550 drawstring is woven IN and OUT through 14 crochet eyelets ([sc 2, ch 1, sk 1] x 14) and locked via a 2-hole spring cord lock stopper so the crochet sleeve grips the neck tightly with zero upward or downward slip.",
      "Continuous 4mm Paracord 550 core inside both the 30 cm short strap and 100 cm Thermal Stitch long strap guarantees 0% permanent strap elongation.",
      "Double-layer Zone 1 base enclosing a Ø 7.8 cm × 4 mm EVA foam (Spon Ati) disk distributes 1.3 kg bottom load and absorbs drop impacts.",
    ],
  },
  hangerFitSystem: {
    collarFitSummary:
      "Simplified unified Silicone Neck Ring + Woven Drawstring system tailored for Ø 5.6-5.8 cm vertical neck (24.8-27.8 cm) directly below Ø ~6.0 cm screw cap and above the 21.5-24.8 cm convex dome shoulder.",
    siliconeNeckRing: {
      fitSpec:
        "Wide-Mouth Silicone Tumbler Neck Ring with 2 molded side ear loops; unstretched inner diameter 5.5-5.8 cm (stretches smoothly 5.5-6.2 cm)",
      placementRangeCm: "26.6 - 27.8",
      fitCheckWarning:
        "MUST specify Wide-Mouth / 18oz-32oz tumbler ring size (ID 5.5-6.0 cm). Standard 2.8-3.0 cm PET/Aqua bottle rings will NOT fit Cuculemon 1L.",
      integrationWithCrochetCase:
        "Upper crochet collar rim (26.2-27.8 cm) is crocheted snugly to Ø 5.8 cm with two slight 3-stitch side cutouts/notches for the silicone ring's left/right ear loops. After sliding the Silicone Ring over the upper crochet cuff in the neck groove, lock both pieces together using 4 Polycherry whip-stitch/tacking loops (front, back, left, right) passing yarn over the silicone ring's bottom lip and through top sc stitches.",
    },
    wovenDrawstringChannel: {
      heightRangeCm: "25.4 - 26.2",
      targetFittedDiameterCm: 5.7,
      eyeletPattern:
        "14-eyelet crochet channel on Zone 4 Row 3: [sc 2, ch 1, sk 1] x 14 (double-strand: [sc 1, ch 1, sk 1] x 14)",
      cordType: "4mm Paracord 550 (Type III, 7-strand nylon core)",
      cordCutLengthCm: 65,
      cordLockStopper:
        "Heavy-duty 2-hole spring cord lock (hole Ø 4.5-5.0 mm for dual 4mm paracord passes)",
      assemblyDetail:
        "Woven IN and OUT through all 14 crochet eyelets around y = 25.4-26.2 cm directly below the Silicone Ring; both ends emerge from two adjacent front/side eyelets into the 2-hole spring cord lock stopper and finish with crocheted Polycherry bead tips.",
    },
    hardware: {
      swivelLobsterClasps: {
        quantityPerCase: 4,
        innerEyeWidthCm: 1.5,
        type: "360-degree Swivel Lobster Clasp (Kait Udang / Kew-kew Putar)",
        material: "Heavy-duty zinc alloy / iron",
        attachmentTarget:
          "Clips DIRECTLY into the 2 molded side ear loops of the Silicone Neck Ring (2 clasps on 30 cm Short Strap + 2 clasps on 100 cm Long Strap; no intermediate metal D-rings needed).",
      },
    },
    interchangeableStraps: {
      shortStrap: {
        label: "Short Hand-Carry Strap (Tali Pendek)",
        totalLengthHookToHookCm: 30.0,
        cordSpanCm: 22.5,
        claspAllowanceCm: 7.5,
        coreMaterial: "Twisted / 4-strand braided 4mm Paracord 550",
        crochetDetailing:
          "3.5-4.0 cm tight Polycherry crochet sleeve wraps near each 1.5 cm swivel clasp in character palette colors (concealing paracord splice/whipping)",
        clipPoint:
          "1.5 cm swivel clasps clip directly onto the Silicone Ring's 2 side ear loops",
        stretchUnder1_3Kg: "0%",
      },
      longStrap: {
        label: "Long Crossbody / Shoulder Strap (Tali Panjang)",
        totalLengthHookToHookCm: 100.0,
        strapSpanCm: 92.5,
        claspAllowanceCm: 7.5,
        widthCm: "1.8 - 2.0",
        stitchArchitecture:
          "Flat Thermal Stitch crochet strap (8 sts wide ≈ 1.8-2.0 cm, ~460-480 thermal rows) encapsulating a continuous 4mm Paracord 550 spine inside",
        coreTermination:
          "Internal 4mm Paracord 550 passes directly around the 1.5 cm swivel clasp bars at both ends and locks inside Thermal Stitch sleeves; clasps clip directly into Silicone Ring ear loops",
        stretchUnder1_3Kg: "0% permanent elongation",
      },
    },
  },
  gauge: {
    yarn: "Polycherry / Poly Kilap D27 (100% Polyester, ~1.8-2.0 mm, 100g ≈ 150-160 m per gulung)",
    hookSizeGuide:
      "3.0 mm (5/0) for standard single-strand tight bag tension; 4.0-4.5 mm if worked double-stranded",
    stitchTechnique:
      "Tight Yarn-Under Single Crochet (YU-SC) for rigid wall density and zero dakron show-through",
    standardSingleStrand: {
      label:
        "Single-Strand Polycherry D27 (1 Helai, 3.0 mm hook — Verified Standard Gauge)",
      widthScPerCm: 2.4,
      heightRowsPerCm: 2.6,
      bodyDiameter8_0cmStitches: 60,
      neckDiameter5_8cmStitches: 44,
      cylinder21_5cmRows: 56,
      shoulder3_3cmRows: 9,
      collar3_0cmRows: 8,
    },
    heavyDutyDoubleStrandEquivalent: {
      label:
        "Double-Strand Polycherry D27 (2 Helai Bersama, 4.0-4.5 mm hook — Matches 36-40 / 26-28 Stitch Benchmark)",
      widthScPerCm: 1.6,
      heightRowsPerCm: 1.8,
      bodyDiameter8_0cmStitches: 40,
      neckDiameter5_8cmStitches: 28,
      cylinder21_5cmRows: 39,
      shoulder3_3cmRows: 6,
      collar3_0cmRows: 6,
    },
    gaugeMathNote:
      "Standard Polycherry D27 single-strand tight gauge is 2.4 sc/cm width x 2.6 rows/cm height (25.13 cm circumference = 60 sc; 18.2 cm neck = 44 sc; 21.5 cm cylinder = 56 rows; 3.3 cm convex dome = 9 rows; 3.0 cm vertical neck = 8 rows). Working Polycherry D27 double-stranded (2 ply) yields 1.6 sc/cm x 1.8 rows/cm (40 sc body -> 28 sc neck; 39 + 6 + 6 rows). Both exact stitch tables are provided in every zone so either method locks accurately to Ø 8.0 cm -> Ø 5.7 cm x 27.8 cm height.",
  },
};

export const BOM_COMPONENTS = [
  {
    id: "yarn-polycherry-emerald",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Hijau Mint / Emerald (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Hijau Mint/Daun Cerah (#68C481)",
    fitNote:
      "Benang utama bodi Ø 8.0 cm, leher Ø 5.8 cm, 4 simpul pengikat ring silikon, kaki/lengan, bilah daun bawah, dan strap Sceptile",
    qtyPerCase: "2 gulung (200g; terpakai ±185g)",
    estPriceIdr: 32000,
    shopeeKeyword: "benang rajut polycherry d27 100gr hijau mint",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20hijau%20mint",
    appliesto: ["sceptile"],
  },
  {
    id: "yarn-polycherry-forest",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Hijau Tua / Forest Green (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Hijau Tua Daun (#438D5A)",
    fitNote:
      "Untuk kerah V-neck dada, garis punggung belakang, sirip daun ekor atas, dan daun pergelangan Sceptile",
    qtyPerCase: "1 gulung (100g; terpakai ±55g)",
    estPriceIdr: 16000,
    shopeeKeyword: "benang rajut polycherry d27 100gr hijau tua",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20hijau%20tua",
    appliesto: ["sceptile"],
  },
  {
    id: "yarn-polycherry-coral",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Merah Bata / Coral Red (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Merah Coral (#D6615D)",
    fitNote:
      "Untuk sabuk perut (belly belt) Sceptile, aksen rahang mulut, garis kelopak mata bawah, manik stopper, dan selongsong strap",
    qtyPerCase: "1 gulung (100g; terpakai ±38g)",
    estPriceIdr: 16000,
    shopeeKeyword: "benang rajut polycherry d27 100gr merah bata",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20merah%20bata",
    appliesto: ["sceptile"],
  },
  {
    id: "yarn-polycherry-yellow",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Kuning Muda / Kuning Emas (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Kuning Muda (#E4D17C)",
    fitNote: "Untuk 6 biji punggung 3D (back seeds) dan iris mata Sceptile",
    qtyPerCase: "1 gulung (100g; terpakai ±30g)",
    estPriceIdr: 16000,
    shopeeKeyword: "benang rajut polycherry d27 100gr kuning",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20kuning",
    appliesto: ["sceptile"],
  },
  {
    id: "yarn-polycherry-orange",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Oranye Emas / Tangerine (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Oranye Kunyit Hangat (#EC9D41)",
    fitNote:
      "Benang utama bodi Ø 8.0 cm, leher Ø 5.8 cm, 4 simpul pengikat ring silikon, ekor gemuk, kaki/tangan, rangka luar sayap, tanduk, dan strap Dragonite",
    qtyPerCase: "2 gulung (200g; terpakai ±190g)",
    estPriceIdr: 32000,
    shopeeKeyword: "benang rajut polycherry d27 100gr oranye kunyit",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20oranye%20kunyit",
    appliesto: ["dragonite"],
  },
  {
    id: "yarn-polycherry-cream",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Krem / Ivory (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Krem Gading (#EAD8B3)",
    fitNote:
      "Untuk panel perut bergaris (ribbed belly panel), bagian bawah ekor bergaris, manik stopper, dan 2 antena lengkung Dragonite",
    qtyPerCase: "1 gulung (100g; terpakai ±75g)",
    estPriceIdr: 16000,
    shopeeKeyword: "benang rajut polycherry d27 100gr krem cream",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20krem%20cream",
    appliesto: ["dragonite"],
  },
  {
    id: "yarn-polycherry-teal",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Hijau Tosca Tua / Deep Teal (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Hijau Tosca Tua (#167B75)",
    fitNote:
      "Untuk membran dalam sayap 2-warna dan iris mata Dragonite serta aksen selongsong strap",
    qtyPerCase: "1 gulung (100g; terpakai ±35g)",
    estPriceIdr: 16000,
    shopeeKeyword: "benang rajut polycherry d27 100gr hijau tosca tua",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20hijau%20tosca%20tua",
    appliesto: ["dragonite"],
  },
  {
    id: "yarn-polycherry-offwhite",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Putih Tulang / Off-White (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Putih Tulang (#DCE0E5)",
    fitNote:
      "Untuk 12 cakar kerucut tangan & kaki (6 cakar tangan + 6 cakar kaki) serta kilau mata Dragonite",
    qtyPerCase: "1 gulung (100g; terpakai ±18g)",
    estPriceIdr: 16000,
    shopeeKeyword: "benang rajut polycherry d27 100gr putih tulang",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20putih%20tulang",
    appliesto: ["dragonite"],
  },
  {
    id: "yarn-polycherry-black",
    name: "Benang Rajut Polycherry / Poly Kilap D27 — Hitam (100g)",
    spec: "100% Polyester D27, ±100g (±150-160m) per gulung, warna Hitam (#1F2421)",
    fitNote:
      "Untuk pupil celah vertikal mata Sceptile, pupil & garis mata Dragonite, dan aksen lubang hidung",
    qtyPerCase: "1 gulung (100g; terpakai ±8g)",
    estPriceIdr: 16000,
    shopeeKeyword: "benang rajut polycherry d27 100gr hitam",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=benang%20rajut%20polycherry%20d27%20100gr%20hitam",
    appliesto: ["sceptile", "dragonite"],
  },
  {
    id: "paracord-550-4mm",
    name: "Tali Paracord 550 Tipe III Diameter 4mm (7-Strand Core)",
    spec: "Tali paracord nylon diameter 4 mm, kekuatan putus 550 lbs (249 kg) / SWL ±50 kg",
    fitNote:
      "Dipakai pada 3 titik: 0.65m drawstring disulam keluar-masuk 14 lubang eyelet di y=25.4-26.2cm + 0.55m core Tali Pendek 30cm + 1.30m core Tali Panjang 100cm (0% mulur di beban 1.3 kg)",
    qtyPerCase: "3 meter (terpakai 2.5 meter + cadangan simpul)",
    estPriceIdr: 13500,
    shopeeKeyword: "tali paracord 550 4mm per meter",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=tali%20paracord%20550%204mm%20per%20meter",
    appliesto: ["sceptile", "dragonite"],
  },
  {
    id: "swivel-clasp-15mm",
    name: "Kait Udang / Kew-kew Pengait Tas Putar Lebar Dalam 1.5 cm (Zinc Alloy / Besi)",
    spec: "Swivel lobster clasp putar 360°, lebar dalam lubang tali 1.5 cm, bahan zinc alloy/besi tebal",
    fitNote:
      "Dikaitkan LANGSUNG ke 2 lubang kuping samping bawaan Ring Silikon Leher Tumbler (2 pcs untuk Tali Pendek 30 cm + 2 pcs untuk Tali Panjang 100 cm)",
    qtyPerCase: "4 pcs",
    estPriceIdr: 10000,
    shopeeKeyword: "kait udang kew kew pengait tas 1.5 cm besi alloy",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=kait%20udang%20kew%20kew%20pengait%20tas%201.5%20cm%20besi%20alloy",
    appliesto: ["sceptile", "dragonite"],
  },
  {
    id: "cord-lock-2hole",
    name: "Stopper Tali / Spring Cord Lock 2 Lubang (Lubang 4.5 - 5.0 mm)",
    spec: "Cord lock pegas baja 2 lubang, diameter lubang 4.5-5.0 mm untuk 2 jalur tali paracord 4mm",
    fitNote:
      "Mengunci kedua ujung drawstring Paracord 4mm yang keluar dari saluran 14 eyelet (y=25.4-26.2cm) tepat di bawah Ring Silikon agar sarung tidak melorot",
    qtyPerCase: "1 pcs",
    estPriceIdr: 1500,
    shopeeKeyword: "stopper tali cord lock 2 lubang 4mm 5mm",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=stopper%20tali%20cord%20lock%202%20lubang%204mm%205mm",
    appliesto: ["sceptile", "dragonite"],
  },
  {
    id: "silicone-collar-ring",
    name: "Ring Silikon Leher Botol Tumbler Wide-Mouth + 2 Lubang Kuping (ID 5.5 - 5.8 cm)",
    spec: "Cincin karet silikon elastis tebal dengan 2 lubang kuping samping (side ear loops) untuk leher tumbler 18oz-32oz, ID 5.5-5.8 cm (melar 5.5-6.2 cm)",
    fitNote:
      "Penumpu utama beban 1.3 kg di alur leher atas (y=26.6-27.8cm) tepat di bawah tutup ulir Ø ~6.0 cm; disatukan ke manset rajut atas lewat 4 simpul Polycherry (JANGAN beli ukuran 2.8 cm botol Aqua)",
    qtyPerCase: "1 pcs",
    estPriceIdr: 18000,
    shopeeKeyword: "ring silikon tumbler leher botol 5.5 cm 6 cm",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=ring%20silikon%20tumbler%20leher%20botol%205.5%20cm%206%20cm",
    appliesto: ["sceptile", "dragonite"],
  },
  {
    id: "eva-foam-sheet",
    name: "Busa EVA / Spon Ati Lembaran Tebal 4mm (Rentang 3 - 5 mm)",
    spec: "Busa EVA padat anti-kempes ketebalan 3-5 mm (lembaran potongan kecil/medium)",
    fitNote:
      "Diselipkan cakram Ø 7.8 cm di antara alas rajut ganda Zona 1 (Ø 8.0 cm) agar beban 1.3 kg terdistribusi merata & meredam benturan",
    qtyPerCase: "1 lembar kecil (min. 20x20 cm; terpakai cakram Ø 7.8 cm)",
    estPriceIdr: 12000,
    shopeeKeyword: "spon ati busa eva lembaran 4mm 5mm",
    shopeeUrl:
      "https://shopee.co.id/search?keyword=spon%20ati%20busa%20eva%20lembaran%204mm%205mm",
    appliesto: ["sceptile", "dragonite"],
  },
  {
    id: "dakron-silicon-grade-a",
    name: "Dakron Silikon Grade A (Polyester Fiberfill)",
    spec: "Serat silikon putih lembut mengembang Grade A, kemasan 250 gram",
    fitNote:
      "Isian padat 3D amigurumi: 6 biji punggung, ekor, kaki/tangan, dan relief wajah/crest di leher (terpakai ±85-110g per sarung)",
    qtyPerCase: "1 pack 250g (cukup untuk 2 karakter)",
    estPriceIdr: 16000,
    shopeeKeyword: "dakron silikon grade a 250gr",
    shopeeUrl: "https://shopee.co.id/search?keyword=dakron%20silikon%20grade%20a%20250gr",
    appliesto: ["sceptile", "dragonite"],
  },
];

export const CHARACTERS = {
  sceptile: {
    id: "sceptile",
    name: "Sceptile (Jukain)",
    palette: {
      primary: { name: "Mint / Emerald Leaf Green", hex: "#68C481" },
      secondary: { name: "Dark Forest / Sage Green", hex: "#438D5A" },
      accentBelt: { name: "Coral / Salmon Red", hex: "#D6615D" },
      accentSeeds: { name: "Warm Cream Gold / Pale Yellow", hex: "#E4D17C" },
      detailBlack: { name: "Jet Black", hex: "#1F2421" },
    },
    yarnBreakdown: {
      totalEstimatedGrams: 316,
      rollsToPurchase: 6,
      estimatedYarnCostIdr: 96000,
      colors: [
        {
          color: "Emerald / Mint Green",
          gramsUsed: 185,
          rolls: 2,
          usage:
            "Main body cylinder, base, neck collar, 4 silicone ring whip-stitch tacks, arms/legs, lower tail blades, head crest",
        },
        {
          color: "Dark Forest Green",
          gramsUsed: 55,
          rolls: 1,
          usage:
            "Chest V-collar border, dorsal spine stripe, upper tail blades, dorsal wrist leaf blades",
        },
        {
          color: "Coral / Salmon Red",
          gramsUsed: 38,
          rolls: 1,
          usage:
            "Belly belt band, lower jaw/mouth trim, lower eyelid rim, drawstring bead tips, strap accent wrap",
        },
        {
          color: "Warm Yellow",
          gramsUsed: 30,
          rolls: 1,
          usage: "6 spherical back seeds (2x3) & eye iris",
        },
        {
          color: "Jet Black",
          gramsUsed: 8,
          rolls: 1,
          usage: "Vertical slit pupils, nostrils, brow accents",
        },
      ],
    },
    zones: [
      {
        id: "zone-1",
        title: "Zone 1: Reinforced Double-Layer Base Cradle & Hind Feet Anchor",
        heightRangeCm: "0.0 - 0.8",
        diameterRangeCm: "0.0 - 8.0",
        stitches:
          "Single-strand: MR 6 -> R10 = 60 sc | Double-strand: MR 8 -> R5 = 40 sc",
        rows:
          "Single-strand: 10 rounds + 10 inner base rounds + 1 BLO lock round | Double-strand: 5 rounds + 5 inner rounds + 1 BLO lock",
        colors: ["Mint / Emerald Green (#68C481)"],
        loadBearingNote:
          "Sandwiches a Ø 7.8 cm × 4 mm EVA foam (Spon Ati) disk between outer and inner sc disks before crocheting BLO wall turn. Prevents 1.3 kg stainless steel base from stretching bottom stitches or denting on drop.",
        instructions: [
          "Single-strand (3.0 mm hook): R1 MR 6 sc (6); R2 inc x6 (12); R3 (sc, inc)x6 (18); ... R10 (8 sc, inc)x6 (60). Repeat identical 10 rounds for inner liner disk.",
          "Double-strand alternative (4.5 mm hook): R1 MR 8 sc (8); R2 inc x8 (16); R3 (sc, inc)x8 (24); R4 (2 sc, inc)x8 (32); R5 (3 sc, inc)x8 (40).",
          "Place cut Ø 7.8 cm x 4 mm EVA foam disk between outer base and inner disk, then work R11 (or R6) in BLO catching BOTH outer and inner base loops together (60 sc / 40 sc) to lock a crisp 90° bottom rim.",
        ],
      },
      {
        id: "zone-2",
        title: "Zone 2: Straight Cylinder Torso, Coral Belly Belt & Tail Base",
        heightRangeCm: "0.0 - 21.5",
        diameterRangeCm: "8.0 (circumference 25.13 cm)",
        stitches: "Single-strand: 60 sc around | Double-strand: 40 sc around",
        rows: "Single-strand: 56 rows | Double-strand: 39 rows",
        colors: [
          "Mint / Emerald Green (#68C481)",
          "Coral Red (#D6615D)",
          "Dark Forest Green (#438D5A)",
        ],
        loadBearingNote:
          "Tight Yarn-Under SC creates a rigid 25.13 cm cylindrical sleeve hugging the full 0.0-21.5 cm stainless steel barrel so vertical motion transfers friction evenly rather than sagging.",
        instructions: [
          "Work straight cylinder in tight YU-SC: Rows 1-11 (Mint Green).",
          "Coral Belly Belt (approx. 4.5 - 8.0 cm height): Rows 12-21 (single-strand) or Rows 8-14 (double-strand), switch front/side 38 sts (25 sts double-strand) to Coral Red (#D6615D) while keeping back 22 sts Mint Green.",
          "Rows 22-56: Continue Mint Green straight body up to 21.5 cm height. Add vertical 3-st Dark Forest Green spine rib down back center (sts 29-31) via surface slip stitch or intarsia.",
          "Chest V-Collar Start (19.0 - 21.5 cm): On Rows 49-56 at front center, begin Dark Forest Green V-dip line converging toward front center stitch.",
        ],
      },
      {
        id: "zone-3",
        title: "Zone 3: Rounded Convex Dome Shoulder & Chest V-Collar Apex",
        heightRangeCm: "21.5 - 24.8",
        diameterRangeCm: "8.0 -> 5.7",
        stitches:
          "Single-strand: 60 sc -> 44 sc | Double-strand: 40 sc -> 28 sc",
        rows: "Single-strand: 9 rows | Double-strand: 6 rows",
        colors: [
          "Mint / Emerald Green (#68C481)",
          "Dark Forest Green (#438D5A)",
        ],
        loadBearingNote:
          "Follows the Cuculemon 1L rounded convex dome curve (21.5-24.8 cm) flush against the steel shoulder. Because the Silicone Neck Ring in Zone 4 carries the 1.3 kg suspension load directly from the neck groove, Zone 3 shoulder decreases experience zero tensile strap stretch.",
        instructions: [
          "Single-strand convex dome decrease schedule (9 rows, 60 -> 44 sc): R1-2 sc 60; R3 (13 sc, dec)x4 (56); R4 sc 56; R5 (12 sc, dec)x4 (52); R6 (11 sc, dec)x4 (48); R7 sc 48; R8 (10 sc, dec)x4 (44); R9 sc 44.",
          "Double-strand convex dome schedule (6 rows, 40 -> 28 sc): R1 sc 40; R2 (8 sc, dec)x4 (36); R3 (7 sc, dec)x4 (32); R4 sc 32; R5 (6 sc, dec)x4 (28); R6 sc 28.",
          "Complete Dark Forest Green V-collar border lines wrapping from left/right shoulder edges down to a crisp central V-tip at ~20.5 cm height.",
          "Test-fit over the Cuculemon 1L tumbler before Zone 4: the 3.3 cm dome must hug the convex steel shoulder smoothly with zero air gap.",
        ],
      },
      {
        id: "zone-4",
        title:
          "Zone 4: Vertical Neck Collar, Woven Drawstring Channel & Unified Silicone Ring Saddle",
        heightRangeCm: "24.8 - 27.8",
        diameterRangeCm: "5.6 - 5.8 (circumference 17.6 - 18.2 cm)",
        stitches:
          "Single-strand: 44 sc | Double-strand: 28 sc (with 3-st left/right ear-loop notches)",
        rows: "Single-strand: 8 rows | Double-strand: 6 rows",
        colors: ["Mint / Emerald Green (#68C481)", "Coral Red (#D6615D)"],
        loadBearingNote:
          "PRIMARY 1.3 KG SUSPENSION HUB: No metal D-rings or webbing tabs. The Wide-Mouth Silicone Tumbler Neck Ring (ID 5.5-5.8 cm) sits around the crochet cuff at y = 26.6-27.8 cm directly beneath the Ø ~6.0 cm screw cap flange, united to the crochet collar via 4 Polycherry whip-stitch tacking loops. Directly below it at y = 25.4-26.2 cm, the woven 4mm Paracord 550 drawstring locks the case tightly around the neck. Leaves 27.8-32.0 cm cap, flip-straw spout & side carry loop unobstructed.",
        instructions: [
          "Rows 1-2 (24.8 - 25.5 cm): Work 44 sc (28 sc double-strand) vertically around the lower black neck band at Ø 5.8 cm.",
          "Row 3 (25.4 - 26.2 cm — Woven Drawstring Eyelet Round): Single-strand: [sc 2, ch 1, sk 1] x14, sc 2 (14 evenly spaced eyelets). Double-strand: [sc 1, ch 1, sk 1] x14. Weave 65 cm of 4mm Paracord 550 IN and OUT through all 14 crochet eyelets around the neck, bringing both ends out of two adjacent front/side eyelets into the 2-hole spring cord lock stopper + crochet two small Coral Red bead tips (MR 6 -> 6 sc -> close) over the knotted paracord ends.",
          "Rows 4-5 (26.2 - 26.9 cm): Work 44 sc (28 sc) snugly up the upper silver neck collar.",
          "Rows 6-8 (26.6 - 27.8 cm — Silicone Ring Saddle & Ear-Loop Notches): Work 44 sc (28 sc) up to 27.8 cm height, creating two slight 3-stitch side cutouts/notches (at 3 o'clock & 9 o'clock: leave 3 sts unworked or work sl st dips on R7-8) so the Silicone Ring's left/right molded ear loops rest flush.",
          "Unite Silicone Ring & Crochet Case: Slide the Silicone Tumbler Neck Ring (ID 5.5-5.8 cm) onto the upper crochet cuff at y = 26.6-27.8 cm directly under the Ø ~6.0 cm cap flange. Lock them together as one piece with 4 simple Polycherry whip-stitch/tacking loops (front, back, left, right — passing Polycherry yarn over the bottom lip of the silicone ring and through top sc stitches). Clip the 1.5 cm swivel clasps of the 30 cm / 100 cm straps directly into the Silicone Ring's 2 side ear loops.",
        ],
      },
      {
        id: "zone-5",
        title:
          "Zone 5: Front Collar Sceptile Head Relief, Crest & Slit Eyes (Open-Lid Safe)",
        heightRangeCm: "21.5 - 27.8 (front relief mounted below 27.8 cm rim)",
        diameterRangeCm:
          "Front arc relief (~7.5 cm wide x 6.3 cm tall; top opening & side cap loop free)",
        stitches:
          "Front relief dome: MR 6 -> 30 sc half-shell + 2 pointed head crests (MR 4 -> 14 sc cones)",
        rows: "Snout/face relief 12 rows + 2 crests x 8 rows + lower jaw 4 rows",
        colors: [
          "Mint / Emerald Green (#68C481)",
          "Coral Red (#D6615D)",
          "Warm Yellow (#E4D17C)",
          "Jet Black (#1F2421)",
        ],
        loadBearingNote:
          "Mounted strictly on the front chest/collar arc below 27.8 cm (clear of the left/right Silicone Ring ear loops at 3 & 9 o'clock and clear of the woven drawstring cord lock), keeping the 27.8-32.0 cm cap, flip-straw spout & side carry loop completely usable.",
        instructions: [
          "Sculpted Snout & Brow Relief: Crochet a flattened oval snout/face dome in Mint Green (MR 6 -> 30 sc), stuff lightly with Dakron, and shape subtle brow ridge with Coral Red (#D6615D) crescent lower jaw tucked underneath.",
          "Pointed Twin Head Crests (2 pcs): MR 4 sc, gradually inc to 14 sc over 8 rows; flatten slightly and sew angled upward-outward along upper front sides of the collar below 27.8 cm without blocking screw cap turning.",
          "Slanted Eyes (2 pcs): Crochet Warm Yellow (#E4D17C) almond shapes (ch 5, sc/hdc/sc around), embroider vertical Jet Black (#1F2421) slit pupils and Coral Red lower eyelid rim, stitch symmetrically onto snout sides.",
        ],
      },
      {
        id: "zone-6",
        title:
          "Zone 6: 3D Back Seeds, Leaf Tail, Wrist Leaf Blades, Legs & Silicone-Clipped Straps",
        heightRangeCm:
          "Appended across Zones 1-3 + detachable 30 cm & 100 cm straps",
        diameterRangeCm:
          "Seeds Ø 2.3 cm; Tail length 16 cm; Short Strap 30 cm; Long Strap 100 cm",
        stitches:
          "Seeds: MR 6 -> 18 sc; Tail stem: MR 6 -> 24 sc; Thermal Long Strap: 8 sts wide",
        rows:
          "6 Seeds x 7 rows; Tail 26 rows + 12 leaf blades; Short Strap 30 cm; Long Strap ~470 thermal rows",
        colors: [
          "Mint / Emerald Green (#68C481)",
          "Dark Forest Green (#438D5A)",
          "Warm Yellow (#E4D17C)",
          "Coral Red (#D6615D)",
        ],
        loadBearingNote:
          "All 3D amigurumi appendages are sewn onto the outer crochet shell and firmly stuffed with Dakron so tail/limbs hold shape. Both interchangeable straps carry load via internal 4mm Paracord 550 cores whose 1.5 cm swivel clasps clip directly onto the Silicone Ring's 2 side ear loops.",
        instructions: [
          "6 Yellow Back Seeds (6 pcs): MR 6 -> 12 -> 18 -> 18 -> 18 -> 12 -> 6 sc in Warm Yellow (#E4D17C), stuff firmly with Dakron; sew in 2 vertical columns of 3 seeds along upper/mid back (14.0-23.5 cm height).",
          "Leaf Tail: Crochet tapering Mint Green core cone (MR 6 -> 24 sc over 26 rows, curved slightly upward at 30°, firmly stuffed with Dakron); attach layered serrated leaf fan blades (upper pair Dark Forest Green #438D5A, lower pair Mint Green #68C481, each worked in ch+sc/hdc/dc picot spikes) and stitch tail base broadly at 3.0-9.5 cm back center.",
          "Arms & Dual Wrist Leaf Blades (2 sets): Tubes MR 6 -> 12 sc x 14 rows with 3-claw hand tips; on each forearm stitch 2 flat leaf blades (1 tall 6 cm Mint Green + 1 smaller 4.5 cm Dark Forest Green) pointing upward; attach arms at 19.0-21.5 cm sides.",
          "Muscular Hind Legs & 3-Toed Feet (2 pcs): MR 6 -> 24 sc tapered thigh x 10 rows + 3-toed webbed foot pad, stitched symmetrically to lower Zone 1-2 front sides (0-6 cm) so tumbler case stands upright on a table.",
          "Interchangeable Straps (Direct Clip to Silicone Ring Ear Loops): (A) 30 cm Short Strap = braided/twisted 4mm Paracord 550 core clipped into two 1.5 cm swivel clasps with 4 cm Emerald/Coral/Yellow crochet sleeves locking ends; (B) 100 cm Long Strap = 8-st wide (~1.9 cm) flat Thermal Stitch strap in Emerald + Coral edge stripes with continuous 4mm Paracord 550 core looped through two 1.5 cm swivel clasps. Clip directly into the 2 molded side ear loops of the Silicone Ring.",
        ],
      },
    ],
  },
  dragonite: {
    id: "dragonite",
    name: "Dragonite (Kairyu)",
    palette: {
      primary: { name: "Golden Tangerine Orange", hex: "#EC9D41" },
      bellyCream: { name: "Warm Cream / Ivory", hex: "#EAD8B3" },
      wingTeal: { name: "Deep Ocean Teal", hex: "#167B75" },
      clawWhite: { name: "Off-White / Light Grey", hex: "#DCE0E5" },
      detailBlack: { name: "Jet Black", hex: "#1F2421" },
    },
    yarnBreakdown: {
      totalEstimatedGrams: 326,
      rollsToPurchase: 6,
      estimatedYarnCostIdr: 96000,
      colors: [
        {
          color: "Golden Tangerine Orange",
          gramsUsed: 190,
          rolls: 2,
          usage:
            "Main body back/sides, base, neck collar, 4 silicone ring whip-stitch tacks, plump tail top/sides, arms, legs, outer wing frame, forehead horn",
        },
        {
          color: "Warm Cream / Ivory",
          gramsUsed: 75,
          rolls: 1,
          usage:
            "Ribbed front belly panel, ribbed tail underside panel, drawstring bead tips, 2 S-curved forehead antennae",
        },
        {
          color: "Deep Ocean Teal",
          gramsUsed: 35,
          rolls: 1,
          usage:
            "Inner wing membranes (left & right), eye iris base, strap accent wrap",
        },
        {
          color: "Off-White / Light Grey",
          gramsUsed: 18,
          rolls: 1,
          usage:
            "12 conical claws (6 hand claws + 6 foot claws) & eye specular catchlights",
        },
        {
          color: "Jet Black",
          gramsUsed: 8,
          rolls: 1,
          usage: "Eye pupils, eye outer contour, subtle nostrils",
        },
      ],
    },
    zones: [
      {
        id: "zone-1",
        title: "Zone 1: Reinforced Double-Layer Base Cradle & Heavy Foot Anchor",
        heightRangeCm: "0.0 - 0.8",
        diameterRangeCm: "0.0 - 8.0",
        stitches:
          "Single-strand: MR 6 -> R10 = 60 sc | Double-strand: MR 8 -> R5 = 40 sc",
        rows:
          "Single-strand: 10 rounds + 10 inner base rounds + 1 BLO lock round | Double-strand: 5 rounds + 5 inner rounds + 1 BLO lock",
        colors: ["Golden Tangerine Orange (#EC9D41)", "Warm Cream (#EAD8B3)"],
        loadBearingNote:
          "Identical Ø 7.8 cm × 4 mm EVA foam (Spon Ati) disk sandwiched between outer and inner sc disks and locked via BLO round. Supports 1.3 kg vertical load without bowing.",
        instructions: [
          "Single-strand (3.0 mm hook): Work R1-R10 in Golden Orange (MR 6 -> 60 sc). Make matching 60 sc inner disk.",
          "Double-strand alternative (4.5 mm hook): Work R1-R5 in Golden Orange (MR 8 -> 40 sc) + matching 40 sc inner disk.",
          "Insert Ø 7.8 cm x 4 mm EVA foam cushion between disks, then work BLO lock round catching both disks together (60 sc / 40 sc) to create a flat, non-sagging foundation.",
        ],
      },
      {
        id: "zone-2",
        title: "Zone 2: Straight Cylinder Torso & Ribbed Cream Front Belly Panel",
        heightRangeCm: "0.0 - 21.5",
        diameterRangeCm: "8.0 (circumference 25.13 cm)",
        stitches: "Single-strand: 60 sc around | Double-strand: 40 sc around",
        rows: "Single-strand: 56 rows | Double-strand: 39 rows",
        colors: ["Golden Tangerine Orange (#EC9D41)", "Warm Cream (#EAD8B3)"],
        loadBearingNote:
          "Tight YU-SC cylinder maintains exact 25.13 cm circumference over the 0.0-21.5 cm stainless steel barrel. Ribbed Cream belly panel adds front double-layer stiffness without altering inner Ø 8.0 cm diameter.",
        instructions: [
          "Work straight Golden Orange cylinder for 56 rows (39 rows double-strand) up to 21.5 cm height.",
          "Ribbed Cream Belly Panel (front 1.0 - 21.5 cm): Crochet separately as a curved-bottom tapered front panel in Warm Cream (#EAD8B3) using alternating BLO rows every 2nd row to form 12 crisp horizontal belly ribs (widest ~18 sts / 7.5 cm at belly center, tapering gently to 12 sts / 5.0 cm at chest top).",
          "Alternatively integrate Warm Cream via tapestry/intarsia across front 18 sts (12 sts double-strand) with horizontal surface slip-stitch ribs every 4 rows; stitch panel securely onto front cylinder so tumbler still slides in effortlessly.",
        ],
      },
      {
        id: "zone-3",
        title:
          "Zone 3: Rounded Convex Dome Shoulder, Throat Rib Taper & Dorsal Wings",
        heightRangeCm: "21.5 - 24.8",
        diameterRangeCm: "8.0 -> 5.7",
        stitches:
          "Single-strand: 60 sc -> 44 sc | Double-strand: 40 sc -> 28 sc",
        rows: "Single-strand: 9 rows | Double-strand: 6 rows",
        colors: ["Golden Tangerine Orange (#EC9D41)", "Warm Cream (#EAD8B3)"],
        loadBearingNote:
          "Hugs the 3.3 cm convex steel dome (21.5-24.8 cm) smoothly. Because the Silicone Neck Ring in Zone 4 suspends the 1.3 kg tumbler directly beneath the Ø ~6.0 cm screw cap, Zone 3 shoulder decreases experience zero tensile strap stretch. Dorsal wings anchor at 10 & 2 o'clock behind the Silicone Ring's side ear loops.",
        instructions: [
          "Single-strand convex dome decrease schedule (9 rows, 60 -> 44 sc): R1-2 sc 60; R3 (13 sc, dec)x4 (56); R4 sc 56; R5 (12 sc, dec)x4 (52); R6 (11 sc, dec)x4 (48); R7 sc 48; R8 (10 sc, dec)x4 (44); R9 sc 44.",
          "Double-strand convex dome schedule (6 rows, 40 -> 28 sc): R1 sc 40; R2 (8 sc, dec)x4 (36); R3 (7 sc, dec)x4 (32); R4 sc 32; R5 (6 sc, dec)x4 (28); R6 sc 28.",
          "Taper front Warm Cream ribbed throat extension smoothly up to 24.8 cm (width ~10 sts / 4.0 cm) right under Dragonite's snout relief.",
        ],
      },
      {
        id: "zone-4",
        title:
          "Zone 4: Vertical Neck Collar, Woven Drawstring Channel & Unified Silicone Ring Saddle",
        heightRangeCm: "24.8 - 27.8",
        diameterRangeCm: "5.6 - 5.8 (circumference 17.6 - 18.2 cm)",
        stitches:
          "Single-strand: 44 sc | Double-strand: 28 sc (with 3-st left/right ear-loop notches)",
        rows: "Single-strand: 8 rows | Double-strand: 6 rows",
        colors: ["Golden Tangerine Orange (#EC9D41)", "Warm Cream (#EAD8B3)"],
        loadBearingNote:
          "PRIMARY 1.3 KG SUSPENSION HUB: No metal D-rings or webbing tabs. The Wide-Mouth Silicone Tumbler Neck Ring (ID 5.5-5.8 cm) wraps around the upper crochet cuff (y = 26.6-27.8 cm) directly beneath the Ø ~6.0 cm screw cap flange, locked to the crochet collar with 4 Polycherry whip-stitch tacking loops. Directly below it at y = 25.4-26.2 cm, the woven 4mm Paracord 550 drawstring locks the case snugly around the neck. Leaves 27.8-32.0 cm cap, flip-straw spout & side carry loop unobstructed.",
        instructions: [
          "Rows 1-2 (24.8 - 25.5 cm): Work 44 sc (28 sc double-strand) vertically around the lower black neck band at Ø 5.8 cm.",
          "Row 3 (25.4 - 26.2 cm — Woven Drawstring Eyelet Round): Single-strand: [sc 2, ch 1, sk 1] x14, sc 2. Double-strand: [sc 1, ch 1, sk 1] x14. Weave 65 cm of 4mm Paracord 550 IN and OUT through all 14 crochet eyelets around the neck, bringing both tails out through two adjacent front/side eyelets into the 2-hole spring cord lock stopper + crochet two small Warm Cream bead tips over the knotted ends.",
          "Rows 4-5 (26.2 - 26.9 cm): Work 44 sc (28 sc) snugly up the upper silver neck collar.",
          "Rows 6-8 (26.6 - 27.8 cm — Silicone Ring Saddle & Ear-Loop Notches): Work 44 sc (28 sc) up to 27.8 cm height, creating two slight 3-stitch side cutouts/notches (at 3 o'clock & 9 o'clock) so the Silicone Ring's left/right molded ear loops sit flush.",
          "Unite Silicone Ring & Crochet Case: Slide the Silicone Tumbler Neck Ring (ID 5.5-5.8 cm) onto the upper crochet cuff at y = 26.6-27.8 cm directly under the Ø ~6.0 cm cap flange. Lock both pieces together as one unit with 4 simple Polycherry whip-stitch/tacking loops (front, back, left, right — passing Polycherry yarn over the bottom lip of the silicone ring and through top sc stitches). Clip the 1.5 cm swivel clasps of the 30 cm / 100 cm straps directly into the Silicone Ring's 2 side ear loops.",
        ],
      },
      {
        id: "zone-5",
        title:
          "Zone 5: Front Collar Dragonite Snout, Oval Eyes, Horn & 2 S-Curved Antennae",
        heightRangeCm:
          "21.8 - 27.8 (front collar relief; keeps 27.8-32.0 cm lid & flip-straw unobstructed)",
        diameterRangeCm: "Front arc relief (~7.5 cm wide x 6.0 cm tall)",
        stitches:
          "Snout dome: MR 6 -> 30 sc; Horn: MR 4 -> 10 sc; Antennae: 4-5 sc spiral i-cord tubes",
        rows: "Snout 10 rows; Horn 5 rows; 2 Antennae x 16 rows",
        colors: [
          "Golden Tangerine Orange (#EC9D41)",
          "Warm Cream (#EAD8B3)",
          "Deep Ocean Teal (#167B75)",
          "Off-White (#DCE0E5)",
          "Jet Black (#1F2421)",
        ],
        loadBearingNote:
          "Attached strictly to front chest/collar wall (21.8-27.8 cm) clear of the side Silicone Ring ear loops. Horn & 2 antennae lean gently outward/forward from the 27.5 cm front rim so cap unscrewing & flip-straw drinking remain effortless.",
        instructions: [
          "Rounded Snout & Cheeks: Crochet a plump Golden Orange snout (MR 6 -> 30 sc, 10 rows, stuffed firmly with Dakron), embroider two tiny nostrils and gentle smile arc, sew centered at 22.0-26.2 cm.",
          "Oval Eyes (2 pcs): Oval iris in Deep Teal/Olive (#167B75) + Jet Black (#1F2421) vertical oval pupil + crisp Off-White (#DCE0E5) side crescent highlight, stitched symmetrically above snout.",
          "Central Forehead Horn: Tiny cone in Golden Orange (MR 4 -> 6 -> 8 -> 10 sc over 5 rows) centered at 27.3 cm front rim.",
          "Twin S-Curved Antennae (2 pcs): Work tight 4-sc or 5-sc spiral tubes in Warm Cream (#EAD8B3) for 16 rows (~6.5 cm long); insert twisted spare Polycherry cord inside and shape into gentle upward S-curves flanking the forehead horn.",
        ],
      },
      {
        id: "zone-6",
        title:
          "Zone 6: 2-Tone Wings, Plump Tail with Ribbed Underside, Clawed Limbs & Silicone-Clipped Straps",
        heightRangeCm:
          "Appended across Zones 1-3 + detachable 30 cm & 100 cm straps",
        diameterRangeCm:
          "Tail length 17 cm; Wing span ~9.5 cm each; Short Strap 30 cm; Long Strap 100 cm",
        stitches:
          "Tail: MR 6 -> 34 sc; Wing membrane: row-worked scalloped bat-wing + orange rim; Thermal Long Strap: 8 sts wide",
        rows:
          "Tail 32 rows; Wings 14 rows each; 12 Claws x 4 rows; Short Strap 30 cm; Long Strap ~470 thermal rows",
        colors: [
          "Golden Tangerine Orange (#EC9D41)",
          "Warm Cream (#EAD8B3)",
          "Deep Ocean Teal (#167B75)",
          "Off-White (#DCE0E5)",
        ],
        loadBearingNote:
          "Plump tail & 2-tone wings are sewn onto outer crochet fabric and balanced symmetrically so the 1.3 kg tumbler bag hangs upright. Both interchangeable straps carry load via internal 4mm Paracord 550 cores whose 1.5 cm swivel clasps clip directly onto the Silicone Ring's 2 side ear loops.",
        instructions: [
          "2-Tone Dragonite Wings (2 pcs, Mirror Left & Right): Crochet inner bat-wing membrane in Deep Ocean Teal (#167B75) with 3 scalloped bottom points (14 rows), back layer in Golden Orange (#EC9D41) with raised top wing-bone ridge, sc-join both layers together around perimeter with Golden Orange edging (optional thin 2 mm EVA trim inside upper leading edge for crisp wing flare). Attach to upper back shoulder at 19.0-24.5 cm (10 & 2 o'clock) clear of the Silicone Ring ear loops.",
          "Plump Tail with Ribbed Cream Underside: Crochet tapering cone in Golden Orange (MR 6 -> 34 sc over 32 rows, stuffed densely with Dakron to curve upward 17 cm without dragging); crochet a tapered Warm Cream (#EAD8B3) ribbed panel (8 BLO ribs) along the underside curve as seen on rear view; sew broad tail root across back 2.0-9.5 cm.",
          "Clawed Arms & Feet (2 arms + 2 sturdy feet): Work chunky Golden Orange arms (MR 6 -> 16 sc x 13 rows) and rounded legs/feet (MR 6 -> 22 sc x 12 rows); crochet 12 tiny Off-White (#DCE0E5) conical claws (MR 4 -> 6 sc, 4 rows) — 3 per hand, 3 per foot — sew firmly onto limb tips. Anchor feet at Zone 1-2 front lower corners (0-6 cm) and arms at 18.5-21.5 cm.",
          "Interchangeable Straps (Direct Clip to Silicone Ring Ear Loops): (A) 30 cm Short Strap = twisted/braided 4mm Paracord 550 core clipped into two 1.5 cm swivel clasps with 4 cm Golden Orange/Cream/Teal crochet clasp sleeves; (B) 100 cm Long Strap = 8-st wide (~1.9 cm) flat Thermal Stitch strap in Golden Orange with Cream center rib & Teal border accent, encapsulating a continuous 4mm Paracord 550 core looped into both 1.5 cm swivel clasps. Clip directly into the 2 molded side ear loops of the Silicone Ring.",
        ],
      },
    ],
  },
};
