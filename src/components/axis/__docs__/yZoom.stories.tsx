import type { Meta, StoryObj } from "@storybook/react";
import YZoomExample from "./y-zoom-example";

const meta: Meta<typeof YZoomExample> = {
	title: "Axis/Y zoom",
	component: YZoomExample,
	argTypes: {
		zoomStep: { control: { type: "number", step: 0.05 } },
		zoomSnap: { control: { type: "number" } },
	},
};

export default meta;

type Story = StoryObj<typeof YZoomExample>;

// Rotella del mouse sul grafico = zoom sull'asse Y attorno al cursore; doppio
// click = reset. Il dominio corrente e' mostrato sopra il grafico (onZoomChange).
export const Wheel: Story = {};

// zoomStep piu' alto = zoom piu' aggressivo; zoomSnap=1 = dominio a interi.
export const StepAndSnap: Story = {
	args: { zoomStep: 1.4, zoomSnap: 1 },
};
