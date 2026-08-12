import type { Meta, StoryObj } from "@storybook/react";
import TimeAxisExample from "./time-axis-example";

const meta: Meta<typeof TimeAxisExample> = {
	title: "Axis/Time scale",
	component: TimeAxisExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					'Asse X temporale: `scaleType="time"` posiziona i punti in base alla data (non all\'indice). `parseDate` converte la stringa.',
					"",
					"```tsx",
					'import { Chart, Line, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />',
					'  <Line name="vendite" showDots />',
					"  <XAxis",
					'    scaleType="time"',
					"    parseDate={(d) => new Date(d).getTime()}",
					"  />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof TimeAxisExample>;

// ticks="data": un tick per punto dato, alla sua posizione temporale. I due
// punti del 1 e 3 gennaio restano vicini, il salto a febbraio e' largo. Passa
// il mouse: l'hover aggancia il punto DATO piu' vicino nel tempo.
export const AllDataPoints: Story = {
	args: { ticks: "data" },
};

// ticks={6}: sei tick equispaziati nel dominio temporale (non sui punti dato),
// etichettati con la data formattata.
export const EvenlySpacedTicks: Story = {
	args: { ticks: 6 },
};
