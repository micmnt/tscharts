import type { Meta, StoryObj } from "@storybook/react";
import Example from "./stacked-example";

const meta: Meta<typeof Example> = {
	title: "Bar Chart/Stacked",
	component: Example,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					'Barre impilate: serie `type: "bar-stacked"` + `<Bar stacked />`.',
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis } from "tscharts";',
					"",
					"const elements = [",
					'  { name: "serie A", type: "bar-stacked", data },',
					'  { name: "serie B", type: "bar-stacked", data },',
					"];",
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="tempi migliori" />',
					'  <Bar name="serie A" stacked />',
					'  <Bar name="serie B" stacked />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof Example>;

export const Stacked: Story = {
	args: {
		name: "tempi migliori",
		stacked: true,
		showLabels: false,
		barWidth: 40,
	},
};
