import type { Meta, StoryObj } from "@storybook/react";
import DynamicBarWidthExample from "./dynamic-barwidth-example";

const meta: Meta<typeof DynamicBarWidthExample> = {
	title: "Bar Chart/Dynamic barWidth",
	component: DynamicBarWidthExample,
	argTypes: {
		barWidth: { control: { type: "range", min: 8, max: 70, step: 2 } },
	},
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"La larghezza delle barre è condivisa e si imposta su `<Chart barWidth>`.",
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements} barWidth={12}>",
					'  <YAxis name="vendite" />',
					'  <Bar name="vendite" />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof DynamicBarWidthExample>;

export const DynamicBarWidth: Story = {
	args: {
		barWidth: 12,
	},
};
