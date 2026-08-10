import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";

const meta: Meta<typeof Example> = {
	title: "Bar Chart",
	component: Example,
};

export default meta;

type Story = StoryObj<typeof Example>;

export const Simple: Story = {
	args: {
		name: "tempi migliori",
		stacked: false,
		showLabels: false,
		// API v1.0: barWidth su <Chart>, onBarClick prop piatta di <Bar>.
		barWidth: 40,
		onBarClick: (value: unknown) => console.log("[onBarClick]", value),
	},
};

// Retrocompatibilita': l'oggetto `config` e' ancora accettato ma DEPRECATO.
// Apri la console per i warnDev: barWidth -> <Chart> (M1), radius -> prop piatta
// di <Bar> (M4). Verra' rimosso nella 2.0.
export const DeprecatedConfig: Story = {
	name: "config (deprecato)",
	args: {
		name: "tempi migliori",
		stacked: false,
		showLabels: false,
		config: {
			barWidth: 40,
			radius: 8,
		},
	},
};
