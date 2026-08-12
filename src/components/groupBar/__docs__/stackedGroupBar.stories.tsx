import type { Meta, StoryObj } from "@storybook/react";
import StackedExample from "./stacked-example";

const meta: Meta<typeof StackedExample> = {
	title: "GroupBar Chart/Stacked",
	component: StackedExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Tre serie `group-bar` con lo stesso `stackedName`: nella stessa categoria le barre si impilano.",
					"",
					"```tsx",
					'import { Chart, GroupBar, XAxis, YAxis } from "tscharts";',
					"",
					"const elements = [",
					'  { name: "prodotto A", type: "group-bar", axisName: "vendite", stackedName: "gruppo1", data },',
					'  { name: "prodotto B", type: "group-bar", axisName: "vendite", stackedName: "gruppo1", data },',
					'  { name: "prodotto C", type: "group-bar", axisName: "vendite", stackedName: "gruppo1", data },',
					"];",
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />',
					'  <GroupBar name="prodotto A" stacked />',
					'  <GroupBar name="prodotto B" stacked />',
					'  <GroupBar name="prodotto C" stacked />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof StackedExample>;

export const Stacked: Story = {
	args: {
		showLabels: false,
	},
};
