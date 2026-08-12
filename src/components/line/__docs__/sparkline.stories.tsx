import type { Meta, StoryObj } from "@storybook/react";
import SparklineCardExample from "./sparkline-card-example";
import SparklineExample from "./sparkline-example";

const meta: Meta = {
	title: "Line Chart/Sparkline",
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Una sparkline è una composizione: `<Chart>` compatto senza assi + `<Line fillGradient>`.",
					"",
					"```tsx",
					'import { Chart, Line } from "tscharts";',
					"",
					"<Chart width={120} height={36} theme={{ padding: 4 }} elements={[serie]}>",
					'  <Line name="s" fillGradient />',
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj;

export const InTable: Story = {
	render: () => <SparklineExample />,
};

export const InCard: Story = {
	render: () => <SparklineCardExample />,
};
