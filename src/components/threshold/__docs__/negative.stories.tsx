import type { Meta, StoryObj } from "@storybook/react";
import NegativeExample from "./negative-example";

const meta: Meta<typeof NegativeExample> = {
	title: "Threshold Chart/Negative",
	component: NegativeExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"`<Threshold>` disegna una linea di riferimento (es. una media) sul grafico.",
					"",
					"```tsx",
					'import { Chart, Bar, Threshold, XAxis, YAxis } from "tscharts";',
					"",
					"const elements = [",
					'  { name: "variazione", type: "bar", data },',
					'  { name: "media", type: "threshold", data: 10 },',
					"];",
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="variazione" showGrid />',
					'  <Bar name="variazione" showLabels />',
					'  <Threshold name="media" dashed showLabel />',
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

export const Negative: Story = {};
