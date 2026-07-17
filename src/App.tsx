"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Atom,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  FlaskConical,
  Gauge,
  Layers3,
  Play,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wind,
} from "lucide-react";
import SceneCanvas, { type MapView } from "./components/SceneCanvas";
import SpectralChart from "./components/SpectralChart";
import { calculateMetrics } from "./lib/metrics";
import { buildAnalystBrief } from "./lib/report";
import {
  SCENES,
  analyzeScene,
  defaultSelectedPixel,
  probabilityForModel,
  type ModelId,
  type SceneId,
} from "./lib/simulation";

const modelLabels: Record<ModelId, string> = {
  "matched-filter": "Matched filter baseline",
  "spectral-logistic": "Spectral logistic + context",
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

export default function App() {
  const [sceneId, setSceneId] = useState<SceneId>("permian");
  const [modelId, setModelId] = useState<ModelId>("spectral-logistic");
  const [threshold, setThreshold] = useState(0.55);
  const [view, setView] = useState<MapView>("overlay");
  const [selectedByScene, setSelectedByScene] = useState<Partial<Record<SceneId, number>>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [reportOpen, setReportOpen] = useState(true);

  const analysis = useMemo(() => analyzeScene(sceneId), [sceneId]);
  const probabilities = probabilityForModel(analysis, modelId);
  const selectedPixel = selectedByScene[sceneId] ?? defaultSelectedPixel(analysis);
  const metrics = useMemo(
    () => calculateMetrics(probabilities, analysis.groundTruth, threshold),
    [probabilities, analysis.groundTruth, threshold],
  );
  const baselineMetrics = useMemo(
    () => calculateMetrics(analysis.baselineProbability, analysis.groundTruth, threshold),
    [analysis, threshold],
  );
  const modelMetrics = useMemo(
    () => calculateMetrics(analysis.modelProbability, analysis.groundTruth, threshold),
    [analysis, threshold],
  );
  const report = buildAnalystBrief(analysis, metrics, modelId, threshold);
  const peakProbability = Math.max(...probabilities);

  const runAnalysis = () => {
    setIsRunning(true);
    window.setTimeout(() => setIsRunning(false), 650);
  };

  const downloadCase = () => {
    const payload = {
      project: "MethaneLens",
      generatedAt: new Date().toISOString(),
      dataCard: "Transparent synthetic hyperspectral benchmark",
      scene: analysis.config,
      model: modelLabels[modelId],
      threshold,
      metrics,
      report,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `methanelens-${sceneId}-case.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Radar size={19} /></span>
          <span>MethaneLens <b>AI</b></span>
        </div>
        <nav aria-label="Primary navigation">
          <a href="#workspace" className="active">Workspace</a>
          <a href="#method">Method</a>
          <a href="#provenance">Data card</a>
        </nav>
        <div className="prototype-pill"><span /> RESEARCH PROTOTYPE</div>
      </header>

      <div className="workspace" id="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <span className="eyebrow">CASE QUEUE</span>
            <span className="case-count">03 scenes</span>
          </div>
          <div className="scene-list">
            {SCENES.map((scene, index) => (
              <button
                type="button"
                key={scene.id}
                className={`scene-item ${sceneId === scene.id ? "selected" : ""}`}
                onClick={() => setSceneId(scene.id)}
              >
                <span className="scene-index">0{index + 1}</span>
                <span>
                  <b>{scene.title}</b>
                  <small>{scene.location}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>

          <div className="control-block">
            <label htmlFor="model">Detection method</label>
            <select id="model" value={modelId} onChange={(event) => setModelId(event.target.value as ModelId)}>
              <option value="spectral-logistic">Spectral logistic + context</option>
              <option value="matched-filter">Matched filter baseline</option>
            </select>
          </div>

          <div className="control-block threshold-control">
            <div className="control-label-row">
              <label htmlFor="threshold">Review threshold</label>
              <output>{threshold.toFixed(2)}</output>
            </div>
            <input
              id="threshold"
              type="range"
              min="0.25"
              max="0.85"
              step="0.01"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
            />
            <div className="range-labels"><span>sensitive</span><span>specific</span></div>
          </div>

          <button type="button" className="run-button" onClick={runAnalysis} disabled={isRunning}>
            {isRunning ? <Activity size={17} className="spin" /> : <Play size={17} fill="currentColor" />}
            {isRunning ? "Analyzing cube…" : "Run analysis"}
          </button>

          <div className="data-note" id="provenance">
            <Database size={17} />
            <div>
              <b>Transparent demo data</b>
              <span>Synthetic 64 × 64 × 56 cube</span>
              <span>2.00–2.45 μm · seeded</span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <section className="hero-row">
            <div>
              <span className="eyebrow">EXPLAINABLE HYPERSPECTRAL ANALYSIS</span>
              <h1>Explain the signal.<br />Not just the mask.</h1>
              <p>Review methane candidates with spectral evidence, spatial context, reproducible metrics, and an analyst-ready decision trail.</p>
            </div>
            <div className="hero-actions">
              <button type="button" className="secondary-button" onClick={downloadCase}>
                <ArrowDownToLine size={17} /> Export case
              </button>
              <button type="button" className="primary-button" onClick={() => setReportOpen((open) => !open)}>
                <Sparkles size={17} /> {reportOpen ? "Hide brief" : "Open brief"}
              </button>
            </div>
          </section>

          <section className="analysis-grid">
            <div className="panel map-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">SCENE 0{SCENES.findIndex((scene) => scene.id === sceneId) + 1}</span>
                  <h2>{analysis.config.title}</h2>
                  <p>{analysis.config.description}</p>
                </div>
                <div className="view-tabs" role="tablist" aria-label="Map layer">
                  {(["surface", "probability", "overlay", "reference"] as MapView[]).map((mapView) => (
                    <button
                      type="button"
                      key={mapView}
                      className={view === mapView ? "active" : ""}
                      onClick={() => setView(mapView)}
                    >
                      {mapView === "surface" ? "Surface" : mapView === "probability" ? "Probability" : mapView === "overlay" ? "Overlay" : "Reference"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="map-stage">
                <SceneCanvas
                  analysis={analysis}
                  probabilities={probabilities}
                  threshold={threshold}
                  view={view}
                  selectedPixel={selectedPixel}
                  onSelectPixel={(index) => setSelectedByScene((current) => ({ ...current, [sceneId]: index }))}
                />
                <div className="map-scale"><span>0</span><i /><span>640 m</span></div>
                <div className="map-legend">
                  <span>Probability</span>
                  <div className="legend-blocks"><i /><i /><i /><i /><i /></div>
                  <div><span>0.0</span><span>1.0</span></div>
                </div>
                <div className="north-arrow">N<span>↑</span></div>
              </div>
              <div className="scene-meta">
                <span><Wind size={15} /> {analysis.config.wind}</span>
                <span><Layers3 size={15} /> 56 spectral bands</span>
                <span><ScanLine size={15} /> Click map to inspect</span>
              </div>
            </div>

            <div className="panel decision-panel">
              <div className="decision-head">
                <span className={`status-icon ${peakProbability >= 0.7 ? "warning" : "safe"}`}>
                  {peakProbability >= 0.7 ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
                </span>
                <div>
                  <span className="eyebrow">DECISION SUPPORT</span>
                  <h2>{report.status}</h2>
                </div>
              </div>
              <p className="decision-copy">{report.headline}</p>
              <div className="confidence-block">
                <div><span>Peak probability</span><strong>{formatPercent(peakProbability)}</strong></div>
                <div className="confidence-track"><i style={{ width: `${peakProbability * 100}%` }} /></div>
                <small>Model score · not concentration</small>
              </div>
              <div className="evidence-list">
                <div><Atom size={17} /><span><b>Spectral alignment</b><small>CH₄ target window · 2.30–2.38 μm</small></span><Check size={15} /></div>
                <div><CircleDot size={17} /><span><b>Spatial coherence</b><small>Connected downwind structure</small></span><Check size={15} /></div>
                <div><Gauge size={17} /><span><b>Threshold</b><small>{threshold.toFixed(2)} analyst review setting</small></span><span className="value-chip">SET</span></div>
              </div>
              <div className="disclaimer"><FlaskConical size={16} /> Synthetic benchmark. Not for operational alerting.</div>
            </div>
          </section>

          <section className="metrics-row" aria-label="Evaluation metrics">
            <MetricCard label="Dice score" value={metrics.dice.toFixed(2)} note="mask overlap" />
            <MetricCard label="ROC–AUC" value={metrics.auc === null ? "N/A" : metrics.auc.toFixed(2)} note="pixel ranking" />
            <MetricCard label="Precision" value={formatPercent(metrics.precision)} note={`${metrics.fp} false-positive px`} />
            <MetricCard label="Recall" value={formatPercent(metrics.recall)} note={`${metrics.fn} missed px`} />
          </section>

          <section className="lower-grid" id="method">
            <div className="panel spectral-panel">
              <SpectralChart analysis={analysis} selectedPixel={selectedPixel} />
            </div>

            <div className="panel comparison-panel">
              <div className="panel-head compact">
                <div>
                  <span className="eyebrow">MODEL CHECK</span>
                  <h2>Same scene. Same threshold.</h2>
                </div>
                <FlaskConical size={20} />
              </div>
              <div className="comparison-table">
                <div className="comparison-row header"><span>Method</span><span>Dice</span><span>Recall</span></div>
                <div className={`comparison-row ${modelId === "matched-filter" ? "active" : ""}`}>
                  <span><i className="method-dot baseline" />Matched filter</span>
                  <b>{baselineMetrics.dice.toFixed(2)}</b>
                  <b>{formatPercent(baselineMetrics.recall)}</b>
                </div>
                <div className={`comparison-row ${modelId === "spectral-logistic" ? "active" : ""}`}>
                  <span><i className="method-dot model" />Logistic + context</span>
                  <b>{modelMetrics.dice.toFixed(2)}</b>
                  <b>{formatPercent(modelMetrics.recall)}</b>
                </div>
              </div>
              <p className="method-note">The second method is calibrated by gradient descent on a separate, seeded synthetic scene. Spatial smoothing is applied after inference.</p>
            </div>
          </section>

          {reportOpen && (
            <section className="panel report-panel">
              <div className="report-intro">
                <span className="spark-icon"><Sparkles size={20} /></span>
                <div>
                  <span className="eyebrow">GROUNDED ANALYST BRIEF</span>
                  <h2>A decision trail built from structured evidence</h2>
                  <p>This local preview uses a deterministic template. The same evidence object is ready for a server-side GPT-5.6 narrative layer without exposing raw secrets in the browser.</p>
                </div>
                <span className="grounded-badge"><Check size={14} /> GROUNDED</span>
              </div>
              <div className="report-columns">
                <div>
                  <h3>Evidence</h3>
                  <ul>{report.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h3>Required verification</h3>
                  <ol>{report.nextSteps.map((item) => <li key={item}>{item}</li>)}</ol>
                </div>
                <div className="limitations-card">
                  <h3>Limitations</h3>
                  {report.limitations.map((item) => <p key={item}>{item}</p>)}
                </div>
              </div>
            </section>
          )}

          <footer>
            <div className="brand small"><span className="brand-mark"><Radar size={15} /></span><span>MethaneLens</span></div>
            <p>Built as a transparent research prototype for OpenAI Build Week 2026.</p>
            <span>v0.1 · seeded demo</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
