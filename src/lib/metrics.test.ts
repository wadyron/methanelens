import { describe, expect, it } from "vitest";
import { calculateMetrics } from "./metrics";
import { analyzeScene } from "./simulation";

describe("metric calculations", () => {
  it("returns perfect metrics for a perfect classifier", () => {
    const metrics = calculateMetrics([0.9, 0.1, 0.8, 0.2], [1, 0, 1, 0], 0.5);
    expect(metrics.dice).toBe(1);
    expect(metrics.precision).toBe(1);
    expect(metrics.recall).toBe(1);
    expect(metrics.auc).toBe(1);
  });

  it("generates deterministic, bounded analysis output", () => {
    const first = analyzeScene("permian");
    const second = analyzeScene("permian");
    expect(first.modelProbability).toEqual(second.modelProbability);
    expect(first.modelProbability).toHaveLength(64 * 64);
    expect(first.modelProbability.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(first.spectra[0]).toHaveLength(56);
  });

  it("keeps the control scene free of injected methane labels", () => {
    const control = analyzeScene("control");
    expect(control.groundTruth.reduce((sum, value) => sum + value, 0)).toBe(0);
  });

  it("separates plume pixels in both positive benchmark scenes", () => {
    for (const sceneId of ["permian", "four-corners"] as const) {
      const analysis = analyzeScene(sceneId);
      const metrics = calculateMetrics(analysis.modelProbability, analysis.groundTruth, 0.55);
      expect(metrics.auc).not.toBeNull();
      expect(metrics.auc ?? 0).toBeGreaterThan(0.85);
      expect(metrics.dice).toBeGreaterThan(0.5);
    }
  });

  it("limits false alerts in the methane-free control scene", () => {
    const control = analyzeScene("control");
    const metrics = calculateMetrics(control.modelProbability, control.groundTruth, 0.55);
    expect(metrics.falsePositiveRate).toBeLessThan(0.15);
  });
});
