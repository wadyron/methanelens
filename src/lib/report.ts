import type { Analysis, ModelId } from "./simulation";
import type { Metrics } from "./metrics";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function buildAnalystBrief(
  analysis: Analysis,
  metrics: Metrics,
  model: ModelId,
  threshold: number,
) {
  const probabilities =
    model === "matched-filter" ? analysis.baselineProbability : analysis.modelProbability;
  const peak = Math.max(...probabilities);
  const meanDetected =
    probabilities
      .filter((value) => value >= threshold)
      .reduce((sum, value) => sum + value, 0) / Math.max(metrics.predictedPixels, 1);
  const signal =
    metrics.predictedPixels === 0
      ? "No coherent methane candidate exceeded the review threshold."
      : `A spatially coherent candidate covering ${metrics.predictedPixels.toLocaleString()} pixels exceeded the review threshold.`;
  const quality =
    analysis.config.id === "control"
      ? "This control scene contains no injected methane. Any highlighted area should be treated as a false alarm caused by spectral overlap or noise."
      : `Against the synthetic reference mask, the current configuration reaches Dice ${metrics.dice.toFixed(2)} and recall ${percent(metrics.recall)}.`;

  return {
    status: peak >= 0.78 ? "Review recommended" : peak >= 0.55 ? "Low-confidence candidate" : "No candidate",
    confidence: meanDetected,
    headline: signal,
    evidence: [
      `Peak model probability: ${percent(peak)} at a decision threshold of ${threshold.toFixed(2)}.`,
      `The selected model combines absorption alignment near 2.30–2.38 μm with spatial coherence.`,
      quality,
    ],
    limitations: [
      "This case uses a transparent synthetic benchmark, not an operational satellite product.",
      "The result must be verified against calibrated radiance, atmospheric correction, and scene metadata before field action.",
      "Model probability is not an estimate of methane concentration or emission rate.",
    ],
    nextSteps: [
      "Inspect the candidate spectrum against nearby background pixels.",
      "Run the same pipeline on an adjacent acquisition or independent methane enhancement product.",
      "Escalate only after an analyst confirms plume morphology and rules out surface-material confounders.",
    ],
  };
}
