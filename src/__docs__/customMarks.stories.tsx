import type { Meta, StoryObj } from "@storybook/react";
import { CustomMarksExample } from "./custom-marks-example";

// Marche CUSTOM (step 3): componenti dell'utente che leggono il sistema di
// coordinate del grafico via useChartMark e disegnano SVG arbitrario.
const meta: Meta<typeof CustomMarksExample> = {
	title: "Custom marks",
	component: CustomMarksExample,
};

export default meta;

type Story = StoryObj<typeof CustomMarksExample>;

// Rombi su una serie standard: la marca riferisce la serie per nome, quindi
// eredita dominio/tooltip/hover; il punto in hover si riempie.
export const Diamonds: Story = {
	args: { variant: "diamonds" },
};

// Candlestick con dati PROPRI (OHLC): usa solo le scale; la serie "prezzo"
// fornisce categorie e dominio (YAxis min/max copre high/low).
export const Candlestick: Story = {
	args: { variant: "candlestick" },
};

// Marca custom CANVAS-accelerata: ~500 rombi disegnati su un solo <canvas> via
// draw-op (useCanvasMark), con fallback SVG. Regge dataset grandi.
export const CanvasAccelerated: Story = {
	args: { variant: "canvas" },
};

// Linea NEGATIVA con rombi (renderDot) al posto dei pallini: sostituiscono il
// dot, quindi in hover non appare il cerchio; la linea resta.
export const Negative: Story = {
	args: { variant: "negative" },
};

// Linea ORIZZONTALE con rombi (renderDot): la linea resta, in hover niente
// cerchio.
export const Horizontal: Story = {
	args: { variant: "horizontal" },
};
