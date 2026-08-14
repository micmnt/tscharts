import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";
import KpiExample from "./kpi-example";
import OutsideCollisionExample from "./outside-collision-example";

const meta: Meta<typeof Example> = {
	title: "Donut Chart",
	component: Example,
};

export default meta;
type Story = StoryObj<typeof Example>;

export const Simple: Story = {
	args: {
		name: "numero utenti",
		config: {
			innerRadius: 60,
			centerElement: {
				value: "81%",
				valueColor: "#151b23",
				valueSize: 24,
				label: "utenti paganti",
				labelColor: "#4b5563",
				labelSize: 12,
			},
		},
	},
};

// Riproduzione progressiva del mockup "donut KPI". I Controls modificano solo la
// CONFIGURAZIONE del donut (gap, sliceRadius, innerRadius); valori dei segmenti e
// testi del centro sono fissi. Man mano che aggiungiamo le altre feature (badge,
// label esterne — docs/roadmap/donut-kpi.md), questa storia mostrera' il risultato.
export const KpiComparison: StoryObj<typeof KpiExample> = {
	name: "KPI Comparison (WIP)",
	render: (args) => <KpiExample {...args} />,
	args: {
		innerRadius: 46,
		gap: 3,
		sliceRadius: 6,
	},
	argTypes: {
		innerRadius: { control: { type: "range", min: 10, max: 120, step: 2 } },
		gap: { control: { type: "range", min: 0, max: 20, step: 1 } },
		sliceRadius: { control: { type: "range", min: 0, max: 30, step: 1 } },
	},
};

// Molti segmenti con label esterne: senza anti-collisione le label del blocco di
// fette piccole ("Centro *") si sovrapporrebbero; la v2 le distanzia sul lato.
export const OutsideLabelsCollision: StoryObj<typeof OutsideCollisionExample> =
	{
		name: "Outside labels (anti-collisione)",
		render: () => <OutsideCollisionExample />,
	};
