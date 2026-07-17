import type { Analysis } from "../lib/simulation";

type Props = {
  analysis: Analysis;
  selectedPixel: number;
};

function points(values: number[], min: number, max: number, width: number, height: number) {
  return values
    .map((value, index) => {
      const x = 48 + (index / (values.length - 1)) * (width - 68);
      const y = 18 + (1 - (value - min) / Math.max(max - min, 1e-8)) * (height - 52);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function SpectralChart({ analysis, selectedPixel }: Props) {
  const width = 760;
  const height = 270;
  const selected = analysis.spectra[selectedPixel];
  const background = analysis.backgroundSpectrum;
  const min = Math.min(...selected, ...background) - 0.008;
  const max = Math.max(...selected, ...background) + 0.008;
  const absorptionStart = 48 + ((2285 - 2000) / 450) * (width - 68);
  const absorptionWidth = ((2390 - 2285) / 450) * (width - 68);
  const selectedX = selectedPixel % analysis.size;
  const selectedY = Math.floor(selectedPixel / analysis.size);

  return (
    <div className="spectral-chart-wrap">
      <div className="chart-topline">
        <div>
          <span className="eyebrow">SPECTRAL EVIDENCE</span>
          <h3>Pixel spectrum vs. scene background</h3>
        </div>
        <span className="coordinate-chip">x {selectedX} · y {selectedY}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="spectral-chart" role="img" aria-label="Selected and background spectra">
        <rect x={absorptionStart} y="16" width={absorptionWidth} height={height - 49} className="absorption-window" />
        {[0, 1, 2, 3].map((line) => {
          const y = 18 + (line / 3) * (height - 52);
          return <line key={line} x1="48" x2={width - 20} y1={y} y2={y} className="grid-line" />;
        })}
        <polyline points={points(background, min, max, width, height)} className="spectrum background-spectrum" />
        <polyline points={points(selected, min, max, width, height)} className="spectrum selected-spectrum" />
        <line x1="48" x2={width - 20} y1={height - 34} y2={height - 34} className="axis-line" />
        {[2000, 2100, 2200, 2300, 2400].map((wavelength) => {
          const x = 48 + ((wavelength - 2000) / 450) * (width - 68);
          return (
            <g key={wavelength}>
              <line x1={x} x2={x} y1={height - 34} y2={height - 29} className="axis-line" />
              <text x={x} y={height - 12} textAnchor="middle" className="axis-label">{wavelength}</text>
            </g>
          );
        })}
        <text x={absorptionStart + absorptionWidth / 2} y="31" textAnchor="middle" className="window-label">CH₄ evidence window</text>
      </svg>
      <div className="chart-legend">
        <span><i className="legend-line selected" />Selected pixel</span>
        <span><i className="legend-line background" />Scene median</span>
        <span className="chart-unit">Wavelength (nm)</span>
      </div>
    </div>
  );
}
