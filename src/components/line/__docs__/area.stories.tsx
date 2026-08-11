import type { Meta, StoryObj } from "@storybook/react";
import AreaExample from "./area-example";

const meta: Meta<typeof AreaExample> = {
	title: "Line Chart/Area",
	component: AreaExample,
};

export default meta;

type Story = StoryObj<typeof AreaExample>;

// Area chart classico: <Line fill fillOpacity>, area fino al fondo.
export const Normal: Story = {
	args: { variant: "normal" },
};

// Area sfumata: stessa prop della sparkline, <Line fillGradient> (colore ->
// trasparente verso il basso).
export const Gradient: Story = {
	args: { variant: "gradient" },
};

// Valori misti positivi/negativi: l'area va dal tratto alla linea dello zero
// (a meta' canvas), sopra E sotto.
export const Negative: Story = {
	args: { variant: "negative" },
};

// Doppio asse Y con due aree miste semi-trasparenti: si vedono le intersezioni
// attorno allo zero condiviso.
export const DualMixed: Story = {
	args: { variant: "dual" },
};
