import type { Meta, StoryObj } from "@storybook/react";
import AutoBarWidthExample from "./auto-barwidth-example";

const meta: Meta<typeof AutoBarWidthExample> = {
	title: "Bar Chart/Auto barWidth",
	component: AutoBarWidthExample,
	argTypes: {
		pointsCount: { control: { type: "range", min: 2, max: 30, step: 1 } },
		barWidth: { control: { type: "select" }, options: ["auto", 25] },
	},
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					'`<Chart barWidth="auto">` calcola la larghezza delle barre dallo spazio',
					"disponibile: una frazione del passo fra due categorie, quindi le barre si",
					"stringono quando i dati aumentano e si allargano quando diminuiscono,",
					"senza mai sovrapporsi.",
					"",
					"```tsx",
					'import { Bar, Chart, XAxis, YAxis } from "tscharts";',
					"",
					'<Chart elements={elements} barWidth="auto">',
					'  <YAxis name="vendite" />',
					'  <Bar name="vendite" />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
					"",
					"Muovi lo slider **pointsCount** per cambiare il numero di categorie: con",
					'`"auto"` le barre si adattano, con il valore fisso `25` restano larghe',
					"uguale e oltre una certa soglia si sovrappongono (era l'unico",
					"comportamento disponibile prima).",
					"",
					"Vale anche per `group-bar` (la frazione viene divisa fra le barre del",
					"gruppo, gap incluso), per le barre orizzontali (il passo si misura",
					'sull\'asse Y) e con `<XAxis scaleType="time">`, dove il passo diventa la',
					"distanza minima fra due date.",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof AutoBarWidthExample>;

export const Auto: Story = {
	args: { pointsCount: 8, barWidth: "auto" },
};

export const ManyCategories: Story = {
	args: { pointsCount: 30, barWidth: "auto" },
};

export const FixedForComparison: Story = {
	args: { pointsCount: 30, barWidth: 25 },
};
