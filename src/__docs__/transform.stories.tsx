import type { Meta, StoryObj } from "@storybook/react";
import TransformExample from "./transform-example";

// Layer di trasformazione dati (tscharts/transform): funzioni pure applicate a
// monte di `elements`. Una story per funzione.
const meta: Meta<typeof TransformExample> = {
	title: "Transform",
	component: TransformExample,
};

export default meta;

type Story = StoryObj<typeof TransformExample>;

// Media mobile: la serie grezza (grigia) e la sua media mobile a finestra 4.
export const MovingAverage: Story = {
	args: { fn: "movingAverage" },
};

// Somma progressiva: barre del valore + linea cumulata.
export const Cumulative: Story = {
	args: { fn: "cumulative" },
};

// Aggregazione: dati giornalieri sommati per mese (barre).
export const Aggregate: Story = {
	args: { fn: "aggregate" },
};

// Istogramma: distribuzione dei valori in intervalli di ampiezza 10.
export const Bin: Story = {
	args: { fn: "bin" },
};
