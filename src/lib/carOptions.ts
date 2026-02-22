const MODELS_BY_MAKE_RAW: Record<string, string[]> = {
  "Maruti Suzuki": [
    "Alto K10",
    "Wagon R",
    "Swift",
    "Dzire",
    "Baleno",
    "Brezza",
    "Ertiga",
    "XL6",
    "Ciaz",
    "Fronx",
    "Grand Vitara",
    "Jimny",
    "Ignis",
    "S-Presso",
    "Celerio",
  ],
  Hyundai: [
    "Grand i10 Nios",
    "i20",
    "Aura",
    "Verna",
    "Exter",
    "Venue",
    "Creta",
    "Alcazar",
    "Tucson",
    "Kona Electric",
    "Ioniq 5",
  ],
  Tata: [
    "Tiago",
    "Tigor",
    "Altroz",
    "Punch",
    "Nexon",
    "Harrier",
    "Safari",
    "Curvv",
    "Tiago EV",
    "Tigor EV",
    "Nexon EV",
  ],
  Mahindra: [
    "Bolero",
    "Bolero Neo",
    "Scorpio Classic",
    "Scorpio N",
    "XUV 3XO",
    "XUV700",
    "Thar",
    "Marazzo",
  ],
  Toyota: [
    "Glanza",
    "Urban Cruiser Taisor",
    "Rumion",
    "Hyryder",
    "Innova Crysta",
    "Innova Hycross",
    "Fortuner",
    "Camry",
    "Hilux",
  ],
  Kia: ["Sonet", "Seltos", "Carens", "Carnival", "EV6"],
  Honda: ["Amaze", "City", "Elevate"],
  MG: ["Comet EV", "Astor", "Hector", "Hector Plus", "ZS EV", "Gloster"],
  Skoda: ["Slavia", "Kushaq", "Kodiaq", "Superb"],
  Volkswagen: ["Virtus", "Taigun", "Tiguan"],
  Renault: ["Kwid", "Kiger", "Triber"],
  Nissan: ["Magnite", "X-Trail"],
  Jeep: ["Compass", "Meridian", "Wrangler", "Grand Cherokee"],
  Ford: ["EcoSport", "Figo", "Aspire", "Endeavour"],
  BMW: ["2 Series", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "iX"],
  "Mercedes-Benz": [
    "A-Class Limousine",
    "C-Class",
    "E-Class",
    "S-Class",
    "GLA",
    "GLB",
    "GLE",
    "GLS",
    "EQS",
  ],
  Audi: ["A4", "A6", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  Lexus: ["ES", "NX", "RX", "LX"],
  Volvo: ["XC40", "XC60", "XC90", "S90", "C40"],
  "Land Rover": [
    "Defender",
    "Discovery",
    "Range Rover Evoque",
    "Range Rover Velar",
    "Range Rover Sport",
    "Range Rover",
  ],
  Porsche: ["Macan", "Cayenne", "Panamera", "911", "Taycan"],
  Jaguar: ["F-Pace", "I-Pace"],
  MINI: ["Cooper", "Cooper S", "Countryman"],
  Maserati: ["Ghibli", "Levante", "Grecale", "Quattroporte"],
  BYD: ["Atto 3", "Seal", "eMAX 7"],
  Citroen: ["C3", "C3 Aircross", "eC3", "C5 Aircross"],
  Isuzu: ["D-Max", "V-Cross", "MU-X"],
};

export const MAKE_OPTIONS = Object.keys(MODELS_BY_MAKE_RAW);

export const VARIANT_OPTIONS = [
  "Base",
  "Mid",
  "Top",
  "LXI",
  "VXI",
  "ZXI",
  "ZXI+",
  "Sigma",
  "Delta",
  "Zeta",
  "Alpha",
  "S",
  "SX",
  "SX (O)",
  "EX",
  "S Plus",
  "GX",
  "VX",
  "ZX",
  "ZX (O)",
  "HTE",
  "HTK",
  "HTK+",
  "HTX",
  "GTX+",
  "XE",
  "XM",
  "XT",
  "XZ",
  "XZ+",
  "Z2",
  "Z4",
  "Z6",
  "Z8",
  "Z8L",
  "Sport Line",
  "AMG Line",
  "M Sport",
  "Luxury",
  "Premium",
];

const VARIANTS_BY_MODEL_RAW: Record<string, string[]> = {
  "Alto K10": ["STD", "LXI", "VXI", "VXI+"],
  "Wagon R": ["LXI", "VXI", "ZXI", "ZXI+"],
  Swift: ["LXI", "VXI", "ZXI", "ZXI+"],
  Dzire: ["LXI", "VXI", "ZXI", "ZXI+"],
  Baleno: ["Sigma", "Delta", "Zeta", "Alpha"],
  Brezza: ["LXI", "VXI", "ZXI", "ZXI+"],
  Ertiga: ["LXI", "VXI", "ZXI", "ZXI+"],
  "Grand i10 Nios": ["Era", "Magna", "Sportz", "Asta"],
  i20: ["Era", "Magna", "Sportz", "Asta", "Asta (O)"],
  Verna: ["EX", "S", "SX", "SX (O)"],
  Exter: ["EX", "S", "SX", "SX (O)"],
  Venue: ["E", "S", "SX", "SX (O)"],
  Creta: ["E", "EX", "S", "SX", "SX (O)"],
  Alcazar: ["Prestige", "Platinum", "Signature"],
  Tucson: ["Platinum", "Signature"],
  Tiago: ["XE", "XM", "XT", "XZ", "XZ+"],
  Tigor: ["XE", "XM", "XZ", "XZ+"],
  Altroz: ["XE", "XM", "XT", "XZ", "XZ+"],
  Punch: ["Pure", "Adventure", "Accomplished", "Creative"],
  Nexon: ["Smart", "Pure", "Creative", "Fearless"],
  Harrier: ["Smart", "Pure", "Adventure", "Fearless"],
  Safari: ["Smart", "Pure", "Adventure", "Fearless"],
  "Nexon EV": ["Creative", "Fearless", "Empowered"],
  "Scorpio N": ["Z2", "Z4", "Z6", "Z8", "Z8L"],
  "XUV700": ["MX", "AX3", "AX5", "AX7", "AX7L"],
  Thar: ["AX (O)", "LX"],
  Glanza: ["E", "S", "G", "V"],
  Hyryder: ["E", "S", "G", "V"],
  "Innova Crysta": ["GX", "VX", "ZX"],
  "Innova Hycross": ["GX", "VX", "ZX", "ZX (O)"],
  Fortuner: ["4x2", "4x4", "Legender", "GR-S"],
  Sonet: ["HTE", "HTK", "HTK+", "HTX", "GTX+"],
  Seltos: ["HTE", "HTK", "HTK+", "HTX", "GTX+"],
  Carens: ["Premium", "Prestige", "Luxury", "Luxury Plus"],
  Amaze: ["E", "S", "VX", "ZX"],
  City: ["SV", "V", "VX", "ZX"],
  Elevate: ["SV", "V", "VX", "ZX"],
  Astor: ["Sprint", "Shine", "Select", "Sharp", "Savvy"],
  Hector: ["Style", "Shine", "Smart", "Sharp", "Savvy"],
  Kushaq: ["Active", "Ambition", "Style", "Monte Carlo"],
  Slavia: ["Active", "Ambition", "Style", "Monte Carlo"],
  Virtus: ["Comfortline", "Highline", "Topline", "GT"],
  Taigun: ["Comfortline", "Highline", "Topline", "GT"],
};

export const FUEL_OPTIONS = [
  "Petrol",
  "Diesel",
  "CNG",
  "LPG",
  "Electric",
  "Hybrid",
  "Plug-in Hybrid",
];

export const TRANSMISSION_OPTIONS = [
  "Manual",
  "Automatic",
  "AMT",
  "CVT",
  "DCT",
  "iMT",
  "Torque Converter",
  "e-CVT",
];

const normalize = (value?: string | null) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const MODELS_BY_MAKE = Object.fromEntries(
  Object.entries(MODELS_BY_MAKE_RAW).map(([make, models]) => [normalize(make), models])
) as Record<string, string[]>;

const VARIANTS_BY_MODEL = Object.fromEntries(
  Object.entries(VARIANTS_BY_MODEL_RAW).map(([model, variants]) => [
    normalize(model),
    variants,
  ])
) as Record<string, string[]>;

const ALL_MODELS = Array.from(
  new Set(Object.values(MODELS_BY_MAKE_RAW).flat())
).sort((a, b) => a.localeCompare(b, "en-IN"));

export const getModelOptions = (make?: string | null) => {
  const key = normalize(make);
  if (!key) return ALL_MODELS;
  return MODELS_BY_MAKE[key] ?? ALL_MODELS;
};

export const getVariantOptions = (model?: string | null) => {
  const key = normalize(model);
  if (!key) return VARIANT_OPTIONS;
  return VARIANTS_BY_MODEL[key] ?? VARIANT_OPTIONS;
};
