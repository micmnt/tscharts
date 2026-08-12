import type { Meta, StoryObj } from "@storybook/react";
import DynamicAxesExample from "./dynamic-axes-example";

const meta: Meta<typeof DynamicAxesExample> = {
	title: "Chart/Dynamic axes (.map)",
	component: DynamicAxesExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"I children sono normali componenti React: puoi generare gli assi con `.map`.",
					"",
					"```tsx",
					'import { Chart, Bar, Line, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					"  {yAxes.map((axisName) => (",
					"    <YAxis key={axisName} name={axisName} />",
					"  ))}",
					'  <Bar name="vendite" />',
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

type Story = StoryObj<typeof DynamicAxesExample>;

export const DynamicAxes: Story = {};
