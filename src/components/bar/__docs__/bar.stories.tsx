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
		// API v1.0: barWidth e' una prop di <Chart> (config di layout condivisa).
		barWidth: 40,
		config: {
			barClickAction: (value: unknown) =>
				console.log("[F2 proof] barClickAction", value),
		},
	},
};

// Retrocompatibilita' (M1): barWidth sul config della serie e' ancora accettato
// ma DEPRECATO — apri la console per vedere il warnDev. Verra' rimosso nella 2.0.
export const DeprecatedBarWidthOnConfig: Story = {
	name: "barWidth su config (deprecato)",
	args: {
		name: "tempi migliori",
		stacked: false,
		showLabels: false,
		config: {
			barWidth: 40,
		},
	},
};
