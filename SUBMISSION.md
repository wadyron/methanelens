# Devpost submission working draft

> Edit this in your own voice before pasting it into Devpost. The competition
> guidance explicitly asks participants not to submit an untouched AI-generated
> project description.

## Project name

`MethaneLens` is the submitter-confirmed project name.

## Elevator pitch

An explainable workspace for detecting methane-like plumes in hyperspectral
imagery, inspecting the spectral evidence, comparing model outputs, and
exporting a reviewable case file.

## Thumbnail

Upload `public/devpost-thumbnail.png`. It is a 1536 × 1024 (3:2) abstract
illustration and remains below Devpost's 5 MB image limit.

## Category

Work & Productivity

## About the project

### Inspiration

Methane detection is part of my biomedical engineering master's research on
machine-learning models for hyperspectral imagery. I wanted to turn that broad
research direction into a small product an analyst can actually inspect in a
few minutes. A probability mask is not enough: reviewers also need to see the
spectrum behind a pixel, understand threshold sensitivity, compare a learned
model with a classical baseline, and know what the result does **not** prove.

The scientific direction was inspired by public work such as STARCOP. For this
Build Week submission I created a compact, deterministic synthetic benchmark so
the demo is fast, reproducible, legally straightforward to share, and does not
depend on a multi-gigabyte download.

### What it does

MethaneLens presents three seeded 64 × 64 hyperspectral scenes with 56 bands
from 2.00 to 2.45 μm: a strong point-source plume, a diffuse low-contrast plume,
and a methane-free mineral-confounder control.

An analyst can:

- run either a matched-filter baseline or a lightweight spectral logistic model;
- adjust the decision threshold and immediately see Dice, ROC-AUC, precision,
  recall, and false positives;
- switch between surface, probability, overlay, and reference-mask views;
- click any pixel to compare its spectrum against the scene median;
- review a structured analyst brief with evidence, limitations, and the next
  verification step;
- export a JSON case file containing settings, metrics, evidence, and caveats.

The interface consistently labels the data as synthetic and never presents
model probability as a methane concentration or operational leak alert.

### How I built it

The app is written in TypeScript and React 19 and packaged with vinext for the
OpenAI Sites runtime. The simulator creates a smooth background spectrum,
terrain and material variation, seeded sensor noise, a methane-like absorption
signature, and a spatial plume field. The classical path uses a normalized
matched-filter score. The learned path trains a small logistic pixel classifier
with gradient descent on separate seeded calibration scenes, then adds local
spatial context.

The evaluation functions are implemented directly in the repository and
covered by deterministic tests. The spectrum is rendered as SVG and the scene
maps use Canvas so the whole demo remains lightweight and responsive.

### How I used Codex and GPT-5.6

I built the project in a primary Codex Work thread using GPT-5.6 Sol. I used it
to reduce my original thesis-sized idea into a testable Build Week scope,
implement and review the simulator and model paths, create the interactive UI,
add validation tests, prepare the Sites-compatible build, and audit the product
language for unsupported scientific claims.

My human-directed decisions included the original research problem, target
analyst workflow, scientific limitations, project category, public content, and
final submission choices. The runnable demo does not call a model at runtime;
GPT-5.6 was the development and reasoning engine used to create, test, and
refine it.

### Challenges

The hardest challenge was balancing scientific credibility with a demo that can
be evaluated quickly. The full public datasets are large, and their
redistribution terms require care, so I designed an original synthetic
benchmark and made its limitations visible in the product.

Another challenge was interpretability. A heat map can look convincing even
when it is wrong. Adding a methane-free confounder scene, a classical baseline,
an adjustable threshold, pixel-level spectra, and explicit false-positive
counts makes failure modes visible instead of hiding them.

### What I learned

I learned that an explainable workflow is more useful than a single model score.
Threshold behavior, negative controls, provenance, and next-step guidance are
product features, not just evaluation details. I also learned how much faster a
research prototype becomes reviewable when the finish line includes tests,
truthful labels, a repeatable demo path, and a deployable build.

### What's next

Next I would add adapters for STARCOP and EMIT without redistributing their raw
data, compare SVM, XGBoost, and compact CNN models on spatially separated tiles,
test PCA/ICA preprocessing, and add wavelength-level SHAP explanations. A
server-side GPT-5.6 layer could then turn only the validated structured evidence
object into a citation-aware report, with the deterministic brief retained as a
safe fallback.

## Built with tags

- TypeScript
- React
- vinext
- Vite
- Vitest
- HTML5 Canvas
- SVG
- Codex
- GPT-5.6 Sol
- OpenAI Sites
- Machine Learning
- Hyperspectral Imaging

## Judge testing path

1. Open the demo and keep `Strong point-source plume` selected.
2. Click **Run analysis** and inspect the overlay and metrics.
3. Click a bright plume pixel and inspect the absorption region in the spectrum.
4. Change the threshold and compare the metric response.
5. Switch the model to **Matched filter baseline**.
6. Open `Mineral confounder control` to inspect false positives.
7. Export the JSON case file.

No account, API key, dataset download, or credentials are required.

## Demo video plan (target: 2:20)

### 0:00–0:15 — Problem

“Methane models often end with a heat map. MethaneLens turns that output into
a review workflow where an analyst can inspect the spectral evidence, compare
models, and see limitations before acting.”

### 0:15–0:35 — Build and AI usage

“I built this during OpenAI Build Week in Codex using GPT-5.6 Sol. It helped me
turn my hyperspectral machine-learning research topic into a focused product,
implement the simulation and model paths, build the interface, add tests, and
prepare the deployment.”

### 0:35–1:15 — Main workflow

Run the strong plume scene. Show the probability overlay and metrics. Click one
plume pixel.

“This seeded benchmark has 56 spectral bands. The app compares the selected
pixel with the background spectrum and highlights the methane-sensitive region.
The score is explicitly a model probability, not a concentration estimate.”

### 1:15–1:40 — Model and threshold comparison

Change the threshold, then switch between the logistic model and matched filter.

“The threshold updates Dice, AUC, precision, recall, and false positives. The
classical matched filter provides a transparent baseline for the learned path.”

### 1:40–2:00 — Negative control and report

Open the mineral-confounder scene and the analyst brief.

“The negative control makes failure modes visible. The report stays grounded in
the computed evidence and recommends independent verification rather than an
automatic field alert.”

### 2:00–2:20 — Export and close

Export the JSON case file.

“The result is a small, reproducible bridge from hyperspectral model output to
an analyst-ready review. Next I plan to validate it on STARCOP and compare SVM,
XGBoost, and CNN approaches.”

## Final items still required

- submitter-confirmed project name;
- public demo URL;
- public YouTube demo link under three minutes;
- public or judge-shared code-repository URL;
- `/feedback` Codex Session ID;
- final human edit of the Devpost story;
- accepted rules checkbox and final Submit action.
