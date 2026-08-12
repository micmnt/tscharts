import type { Meta, StoryObj } from "@storybook/react";
import NegativeExample from "./negative-example";

const meta: Meta<typeof NegativeExample> = {
	title: "Bar Chart/Negative",
	component: NegativeExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Con valori negativi il grafico dispone le barre attorno alla linea dello zero.",
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis } from "tscharts";',
					"",
					"// serie con valori negativi",
					"<Chart elements={elements}>",
					'  <YAxis name="variazione" />',
					'  <Bar name="variazione" showLabels />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof NegativeExample>;

export const Negative: Story = {
	args: {
		name: "variazione",
		showLabels: true,
	},
};
