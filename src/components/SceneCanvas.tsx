import { useEffect, useRef } from "react";
import type { Analysis } from "../lib/simulation";

export type MapView = "surface" | "probability" | "overlay" | "reference";

type Props = {
  analysis: Analysis;
  probabilities: number[];
  threshold: number;
  view: MapView;
  selectedPixel: number;
  onSelectPixel: (index: number) => void;
};

function probabilityColor(value: number): [number, number, number] {
  if (value < 0.2) return [7, 20, 18];
  if (value < 0.45) return [23, 73, 69];
  if (value < 0.7) return [45, 160, 136];
  if (value < 0.88) return [255, 184, 90];
  return [255, 102, 86];
}

export default function SceneCanvas({
  analysis,
  probabilities,
  threshold,
  view,
  selectedPixel,
  onSelectPixel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(analysis.size, analysis.size);

    probabilities.forEach((probability, index) => {
      const offset = index * 4;
      const surface = analysis.surface[index];
      let color: [number, number, number] = surface;
      if (view === "probability") color = probabilityColor(probability);
      if (view === "reference") {
        color = analysis.groundTruth[index] ? [69, 214, 181] : [10, 28, 25];
      }
      if (view === "overlay" && probability >= threshold) {
        const heat = probabilityColor(probability);
        color = [
          Math.round(surface[0] * 0.34 + heat[0] * 0.66),
          Math.round(surface[1] * 0.34 + heat[1] * 0.66),
          Math.round(surface[2] * 0.34 + heat[2] * 0.66),
        ];
      }
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
      image.data[offset + 3] = 255;
    });

    context.putImageData(image, 0, 0);
    const selectedX = selectedPixel % analysis.size;
    const selectedY = Math.floor(selectedPixel / analysis.size);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 0.65;
    context.strokeRect(selectedX - 1.4, selectedY - 1.4, 3.8, 3.8);
    context.strokeStyle = "#071412";
    context.lineWidth = 0.35;
    context.strokeRect(selectedX - 0.8, selectedY - 0.8, 2.6, 2.6);
  }, [analysis, probabilities, threshold, view, selectedPixel]);

  return (
    <canvas
      ref={canvasRef}
      width={analysis.size}
      height={analysis.size}
      className="scene-canvas"
      aria-label="Interactive methane analysis map"
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * analysis.size);
        const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * analysis.size);
        onSelectPixel(Math.max(0, Math.min(analysis.size * analysis.size - 1, y * analysis.size + x)));
      }}
    />
  );
}
