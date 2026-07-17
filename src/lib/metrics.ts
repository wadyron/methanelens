export type Metrics = {
  precision: number;
  recall: number;
  dice: number;
  auc: number | null;
  falsePositiveRate: number;
  predictedPixels: number;
  truePixels: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
};

export function calculateAuc(scores: number[], labels: number[]): number | null {
  const positives = labels.reduce((sum, label) => sum + label, 0);
  const negatives = labels.length - positives;
  if (positives === 0 || negatives === 0) return null;

  const ranked = scores
    .map((score, index) => ({ score, label: labels[index] }))
    .sort((a, b) => b.score - a.score);

  let tp = 0;
  let fp = 0;
  let previousTpRate = 0;
  let previousFpRate = 0;
  let area = 0;

  for (const item of ranked) {
    if (item.label === 1) tp += 1;
    else fp += 1;
    const tpRate = tp / positives;
    const fpRate = fp / negatives;
    area += (fpRate - previousFpRate) * (tpRate + previousTpRate) * 0.5;
    previousTpRate = tpRate;
    previousFpRate = fpRate;
  }
  return area;
}

export function calculateMetrics(
  probabilities: number[],
  labels: number[],
  threshold: number,
): Metrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;

  probabilities.forEach((probability, index) => {
    const predicted = probability >= threshold ? 1 : 0;
    const actual = labels[index];
    if (predicted === 1 && actual === 1) tp += 1;
    if (predicted === 1 && actual === 0) fp += 1;
    if (predicted === 0 && actual === 1) fn += 1;
    if (predicted === 0 && actual === 0) tn += 1;
  });

  return {
    precision: tp + fp === 0 ? 0 : tp / (tp + fp),
    recall: tp + fn === 0 ? 0 : tp / (tp + fn),
    dice: 2 * tp + fp + fn === 0 ? 1 : (2 * tp) / (2 * tp + fp + fn),
    auc: calculateAuc(probabilities, labels),
    falsePositiveRate: fp + tn === 0 ? 0 : fp / (fp + tn),
    predictedPixels: tp + fp,
    truePixels: tp + fn,
    tp,
    fp,
    fn,
    tn,
  };
}
