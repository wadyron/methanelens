export type SceneId = "permian" | "four-corners" | "control";
export type ModelId = "matched-filter" | "spectral-logistic";

export type SceneConfig = {
  id: SceneId;
  title: string;
  location: string;
  description: string;
  seed: number;
  plumeStrength: number;
  noise: number;
  sourceX: number;
  sourceY: number;
  wind: string;
};

export type Analysis = {
  config: SceneConfig;
  size: number;
  wavelengths: number[];
  spectra: number[][];
  backgroundSpectrum: number[];
  methaneSignature: number[];
  surface: Array<[number, number, number]>;
  concentration: number[];
  groundTruth: number[];
  baselineProbability: number[];
  modelProbability: number[];
  featureValues: {
    matchedFilter: number[];
    bandDepth: number[];
    spatialContext: number[];
  };
  logisticWeights: number[];
};

export const SCENES: SceneConfig[] = [
  {
    id: "permian",
    title: "Strong point-source plume",
    location: "Permian Basin · synthetic benchmark",
    description: "High-signal release with a coherent downwind structure.",
    seed: 731,
    plumeStrength: 1,
    noise: 0.006,
    sourceX: 14,
    sourceY: 38,
    wind: "ENE · 5.8 m/s",
  },
  {
    id: "four-corners",
    title: "Diffuse low-contrast plume",
    location: "Four Corners · synthetic benchmark",
    description: "A weaker release designed to expose false negatives.",
    seed: 1409,
    plumeStrength: 0.6,
    noise: 0.009,
    sourceX: 18,
    sourceY: 25,
    wind: "E · 3.2 m/s",
  },
  {
    id: "control",
    title: "Mineral confounder control",
    location: "Control scene · synthetic benchmark",
    description: "No methane plume; overlapping mineral absorption tests specificity.",
    seed: 2957,
    plumeStrength: 0,
    noise: 0.008,
    sourceX: 16,
    sourceY: 32,
    wind: "Variable",
  },
];

const SIZE = 64;
const BAND_COUNT = 56;

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianNoise(random: () => number) {
  const u = Math.max(random(), 1e-9);
  const v = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function gaussian(value: number, center: number, width: number) {
  return Math.exp(-0.5 * ((value - center) / width) ** 2);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function percentile(values: number[], quantile: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * quantile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}

function normalizeRobust(values: number[]) {
  const low = percentile(values, 0.05);
  const high = percentile(values, 0.98);
  const range = Math.max(high - low, 1e-9);
  return values.map((value) => clamp((value - low) / range));
}

function smooth(values: number[], size: number, radius = 1) {
  const result = new Array(values.length).fill(0);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < size && py >= 0 && py < size) {
            sum += values[py * size + px];
            count += 1;
          }
        }
      }
      result[y * size + x] = sum / count;
    }
  }
  return result;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function generateRawScene(config: SceneConfig, size = SIZE) {
  const random = mulberry32(config.seed);
  const wavelengths = Array.from(
    { length: BAND_COUNT },
    (_, index) => 2000 + (450 * index) / (BAND_COUNT - 1),
  );
  const rawSignature = wavelengths.map(
    (wavelength) =>
      0.22 * gaussian(wavelength, 2215, 18) +
      0.72 * gaussian(wavelength, 2305, 13) +
      gaussian(wavelength, 2362, 16),
  );
  const signatureMax = Math.max(...rawSignature);
  const methaneSignature = rawSignature.map((value) => value / signatureMax);

  const spectra: number[][] = [];
  const concentration: number[] = [];
  const surface: Array<[number, number, number]> = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / (size - 1);
      const ny = y / (size - 1);
      const terrain =
        0.5 +
        0.22 * Math.sin(nx * 10.4 + ny * 2.1) +
        0.16 * Math.cos(ny * 12.7 - nx * 1.7) +
        0.08 * gaussianNoise(random);
      const material = clamp(
        0.5 + 0.28 * Math.sin(nx * 4.5 - ny * 6.2) + 0.1 * gaussianNoise(random),
      );

      const downwind = x - config.sourceX;
      const centerline = config.sourceY + 4.2 * Math.sin(Math.max(downwind, 0) * 0.17);
      const width = 1.8 + Math.max(downwind, 0) * 0.12;
      const crosswind = y - centerline;
      const plume =
        downwind > 0
          ? config.plumeStrength *
            Math.exp(-downwind / 48) *
            Math.exp(-(crosswind ** 2) / (2 * width ** 2)) *
            (0.88 + 0.2 * Math.sin(downwind * 0.5 + y * 0.22))
          : 0;
      const sourceCore =
        config.plumeStrength *
        0.42 *
        gaussian(x, config.sourceX, 1.7) *
        gaussian(y, config.sourceY, 1.7);
      const plumeConcentration = clamp(plume + sourceCore);
      concentration.push(plumeConcentration);

      const mineralPatch =
        config.id === "control"
          ? 0.7 * gaussian(x, 39, 7) * gaussian(y, 28, 10)
          : 0.2 * gaussian(x, 48, 8) * gaussian(y, 14, 9);
      const albedo = clamp(0.47 + terrain * 0.25, 0.15, 0.9);

      spectra.push(
        wavelengths.map((wavelength, band) => {
          const slope = 0.035 * ((wavelength - 2000) / 450);
          const mineralAbsorption =
            (0.014 + material * 0.02) * gaussian(wavelength, 2185, 28) +
            mineralPatch * 0.025 * gaussian(wavelength, 2336, 27);
          const methaneAbsorption = plumeConcentration * 0.105 * methaneSignature[band];
          const noise = gaussianNoise(random) * config.noise;
          return clamp(0.23 + albedo * 0.24 + slope - mineralAbsorption - methaneAbsorption + noise);
        }),
      );

      surface.push([
        Math.round(clamp(0.28 + albedo * 0.62) * 255),
        Math.round(clamp(0.25 + albedo * 0.48 + material * 0.08) * 255),
        Math.round(clamp(0.2 + albedo * 0.34) * 255),
      ]);
    }
  }

  return { size, wavelengths, spectra, concentration, surface, methaneSignature };
}

function extractFeatures(raw: ReturnType<typeof generateRawScene>) {
  const { size, wavelengths, spectra, methaneSignature } = raw;
  const backgroundSpectrum = wavelengths.map((_, band) =>
    median(spectra.map((spectrum) => spectrum[band])),
  );
  const signatureNorm = methaneSignature.reduce((sum, value) => sum + value * value, 0);

  const matchedRaw = spectra.map((spectrum) =>
    spectrum.reduce(
      (sum, value, band) => sum + (backgroundSpectrum[band] - value) * methaneSignature[band],
      0,
    ) / signatureNorm,
  );

  const coreBands = wavelengths
    .map((wavelength, index) => ({ wavelength, index }))
    .filter(({ wavelength }) => wavelength >= 2285 && wavelength <= 2390)
    .map(({ index }) => index);
  const shoulderBands = wavelengths
    .map((wavelength, index) => ({ wavelength, index }))
    .filter(
      ({ wavelength }) =>
        (wavelength >= 2225 && wavelength <= 2265) ||
        (wavelength >= 2410 && wavelength <= 2445),
    )
    .map(({ index }) => index);
  const averageBands = (spectrum: number[], bands: number[]) =>
    bands.reduce((sum, band) => sum + spectrum[band], 0) / bands.length;
  const bandDepthRaw = spectra.map(
    (spectrum) => averageBands(spectrum, shoulderBands) - averageBands(spectrum, coreBands),
  );

  const matchedFilter = normalizeRobust(matchedRaw);
  const bandDepth = normalizeRobust(bandDepthRaw);
  const spatialContext = smooth(matchedFilter, size, 1);

  return { backgroundSpectrum, matchedFilter, bandDepth, spatialContext };
}

type LogisticModel = { weights: number[] };
let cachedModel: LogisticModel | null = null;

function trainCalibrationModel(): LogisticModel {
  if (cachedModel) return cachedModel;
  const calibrationConfigs: SceneConfig[] = [
    { ...SCENES[0], seed: 8119, plumeStrength: 0.88, noise: 0.008 },
    { ...SCENES[2], seed: 9103, plumeStrength: 0, noise: 0.009 },
  ];
  const rows: Array<{ x: number[]; y: number }> = [];

  calibrationConfigs.forEach((config) => {
    const raw = generateRawScene(config, 38);
    const features = extractFeatures(raw);
    raw.concentration.forEach((concentration, index) => {
      const label = concentration >= 0.16 ? 1 : 0;
      if (label === 1 || index % 7 === 0) {
        rows.push({
          x: [
            1,
            features.matchedFilter[index],
            features.bandDepth[index],
            features.spatialContext[index],
            1 - Math.abs(features.matchedFilter[index] - features.spatialContext[index]),
          ],
          y: label,
        });
      }
    });
  });

  const weights = [-3.2, 2.1, 1.2, 2.2, 0.3];
  const positives = rows.filter((row) => row.y === 1).length;
  const negatives = rows.length - positives;
  for (let epoch = 0; epoch < 360; epoch += 1) {
    const gradient = new Array(weights.length).fill(0);
    rows.forEach((row) => {
      const prediction = sigmoid(row.x.reduce((sum, value, index) => sum + value * weights[index], 0));
      const classWeight = row.y === 1 ? rows.length / (2 * positives) : rows.length / (2 * negatives);
      row.x.forEach((value, index) => {
        gradient[index] += (prediction - row.y) * value * classWeight;
      });
    });
    weights.forEach((weight, index) => {
      const regularization = index === 0 ? 0 : 0.0015 * weight;
      weights[index] -= 0.18 * (gradient[index] / rows.length + regularization);
    });
  }
  cachedModel = { weights };
  return cachedModel;
}

export function analyzeScene(sceneId: SceneId): Analysis {
  const config = SCENES.find((scene) => scene.id === sceneId) ?? SCENES[0];
  const raw = generateRawScene(config);
  const features = extractFeatures(raw);
  const model = trainCalibrationModel();
  const baselineProbability = features.matchedFilter.map((score) => sigmoid((score - 0.58) * 10));
  const rawModelProbability = features.matchedFilter.map((matchedFilter, index) => {
    const inputs = [
      1,
      matchedFilter,
      features.bandDepth[index],
      features.spatialContext[index],
      1 - Math.abs(matchedFilter - features.spatialContext[index]),
    ];
    return sigmoid(inputs.reduce((sum, value, featureIndex) => sum + value * model.weights[featureIndex], 0));
  });
  const smoothedProbability = smooth(rawModelProbability, raw.size, 1);
  const modelProbability = rawModelProbability.map(
    (probability, index) => clamp(probability * 0.62 + smoothedProbability[index] * 0.38),
  );

  return {
    config,
    size: raw.size,
    wavelengths: raw.wavelengths,
    spectra: raw.spectra,
    backgroundSpectrum: features.backgroundSpectrum,
    methaneSignature: raw.methaneSignature,
    surface: raw.surface,
    concentration: raw.concentration,
    groundTruth: raw.concentration.map((value) => (value >= 0.16 ? 1 : 0)),
    baselineProbability,
    modelProbability,
    featureValues: {
      matchedFilter: features.matchedFilter,
      bandDepth: features.bandDepth,
      spatialContext: features.spatialContext,
    },
    logisticWeights: model.weights,
  };
}

export function probabilityForModel(analysis: Analysis, modelId: ModelId) {
  return modelId === "matched-filter" ? analysis.baselineProbability : analysis.modelProbability;
}

export function defaultSelectedPixel(analysis: Analysis) {
  let bestIndex = 0;
  analysis.modelProbability.forEach((probability, index) => {
    if (probability > analysis.modelProbability[bestIndex]) bestIndex = index;
  });
  return bestIndex;
}
