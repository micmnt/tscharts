import type { Meta, StoryObj } from "@storybook/react";
import TimeAxisExample from "./time-axis-example";

const meta: Meta<typeof TimeAxisExample> = {
	title: "Axis/Time scale",
	component: TimeAxisExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					'Asse X temporale: `scaleType="time"` posiziona i punti in base alla data (non all\'indice). `parseDate` converte la stringa.',
					"",
					"```tsx",
					'import { Chart, Line, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />',
					'  <Line name="vendite" showDots />',
					"  <XAxis",
					'    scaleType="time"',
					"    parseDate={(d) => new Date(d).getTime()}",
					"  />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof TimeAxisExample>;

export const AllDataPoints: Story = {
	args: { ticks: "data" },
};

export const EvenlySpacedTicks: Story = {
	args: { ticks: 6 },
};
