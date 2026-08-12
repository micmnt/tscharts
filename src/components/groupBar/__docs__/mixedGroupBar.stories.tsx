import type { Meta, StoryObj } from "@storybook/react";
import MixedExample from "./mixed-example";

const meta: Meta<typeof MixedExample> = {
	title: "GroupBar Chart/Mixed",
	component: MixedExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Un gruppo *stacked* (A + B con lo stesso `stackedName`) e una barra singola non-stacked (C) nella stessa categoria.",
					"",
					"```tsx",
					'import { Chart, GroupBar, XAxis, YAxis } from "tscharts";',
					"",
					"const elements = [",
					'  { name: "prodotto A", type: "group-bar", axisName: "vendite", stackedName: "gruppo1", data },',
					'  { name: "prodotto B", type: "group-bar", axisName: "vendite", stackedName: "gruppo1", data },',
					'  { name: "prodotto C", type: "group-bar", axisName: "vendite", data },',
					"];",
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />',
					'  <GroupBar name="prodotto A" stacked />',
					'  <GroupBar name="prodotto B" stacked />',
					'  <GroupBar name="prodotto C" />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof MixedExample>;

export const Mixed: Story = {
	args: {
		showLabels: true,
	},
};
