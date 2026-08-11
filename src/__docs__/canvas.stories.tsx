import type { Meta, StoryObj } from "@storybook/react";
import { CanvasExample } from "./canvas-example";

// Renderer canvas (ibrido): <Chart renderer="canvas"> disegna le marche dense
// (Line/dot, Bar) su un unico <canvas>; assi/legenda/tooltip restano SVG.
const meta: Meta<typeof CanvasExample> = {
	title: "Canvas renderer",
	component: CanvasExample,
};

export default meta;

type Story = StoryObj<typeof CanvasExample>;

// Scatter denso: ~2000 punti + area sfumata su un solo <canvas> (in SVG
// sarebbero ~2000 <circle>). Hover/tooltip funzionano (calcolo matematico).
export const Scatter: Story = {
	args: { variant: "scatter" },
};

// Barre interattive su canvas: click e drag via hit-testing; le barre cliccabili
// sono raggiungibili anche da tastiera (Tab + Invio).
export const InteractiveBars: Story = {
	args: { variant: "bars" },
};
