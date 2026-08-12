import type { Meta, StoryObj } from "@storybook/react";
import MultiAxisExample from "./multi-axis-example";

const meta: Meta<typeof MultiAxisExample> = {
	title: "Axis/Multi-axis",
	component: MultiAxisExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Più assi Y: ogni serie si collega al proprio `<YAxis>` tramite `axisName`.",
					"",
					"```tsx",
					'import { Chart, Bar, Line, XAxis, YAxis } from "tscharts";',
					"",
					'// serie: { name:"vendite", axisName:"vendite" }, { name:"temperatura", axisName:"temperatura" }',
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />',
					'  <Bar name="vendite" />',
					'  <YAxis name="temperatura" />',
					'  <Line name="temperatura" showDots />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof MultiAxisExample>;

export const TwoAxes: Story = {};
