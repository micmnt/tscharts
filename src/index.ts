export * from "./components";
export type { CanvasDrawOp } from "./contexts/canvasContext";
// Disegno di una marca custom sul canvas condiviso (renderer="canvas"): registra
// una draw-op; no-op in modalita' SVG. Da usare con useChartMark().isCanvas.
export { useCanvasMark } from "./hooks/useCanvasMark";
// Marche custom (step 3): hook pubblico che espone il sistema di coordinate del
// grafico (scale + dimensioni + serie + hover) per comporre marche proprie.
export { type ChartMark, useChartMark } from "./hooks/useChartMark";
// Tema di default (congelato): esportato come riferimento in sola lettura, per
// leggerne/derivarne i valori. L'override normale si fa con la prop `theme` di
// <Chart> (parziale) — vedi README.
export { default as defaultTheme } from "./lib/defaultTheme";
export * from "./types";
