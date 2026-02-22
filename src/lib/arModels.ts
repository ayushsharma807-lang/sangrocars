export type ArModelConfig = {
  modelUrl: string;
  iosModelUrl: string | null;
  label: string;
};

const MODEL_CLEARCOAT_CAR =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ClearCoatCarPaint/glTF-Binary/ClearCoatCarPaint.glb";
const MODEL_BUGGY =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Buggy/glTF-Binary/Buggy.glb";
const MODEL_TOYCAR =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb";

type MakeRule = {
  aliases: string[];
  config: ArModelConfig;
};

const LUXURY_MAKE_RULES: MakeRule[] = [
  {
    aliases: ["mercedes", "mercedes benz", "bmw", "audi", "porsche", "maserati"],
    config: {
      modelUrl: MODEL_CLEARCOAT_CAR,
      iosModelUrl: null,
      label: "Performance sedan",
    },
  },
  {
    aliases: ["land rover", "volvo", "jaguar"],
    config: {
      modelUrl: MODEL_BUGGY,
      iosModelUrl: null,
      label: "Luxury SUV",
    },
  },
  {
    aliases: ["lexus", "mini"],
    config: {
      modelUrl: MODEL_TOYCAR,
      iosModelUrl: null,
      label: "Premium compact",
    },
  },
];

const normalizeMake = (value?: string | null) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getBrandArModel = (make?: string | null): ArModelConfig | null => {
  const normalized = normalizeMake(make);
  if (!normalized) return null;

  for (const rule of LUXURY_MAKE_RULES) {
    if (
      rule.aliases.some(
        (alias) =>
          normalized === alias ||
          normalized.startsWith(`${alias} `) ||
          normalized.endsWith(` ${alias}`) ||
          normalized.includes(` ${alias} `)
      )
    ) {
      return rule.config;
    }
  }

  return null;
};

