import type { Meta, StoryObj } from "@storybook/react";
import DragNegativeExample from "./drag-negative-example";

const meta: Meta<typeof DragNegativeExample> = {
	title: "Bar Chart/Draggable Negative",
	component: DragNegativeExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Su un grafico con valori negativi il drag può scendere sotto lo zero.",
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis, Tooltip } from "tscharts";',
					"",
					"// serie con valori sia positivi che negativi",
					"<Chart elements={[serie]}>",
					'  <YAxis name="variazione" showGrid />',
					'  <Bar name="variazione" showLabels onBarDrag={(p) => console.log(p.value)} />',
					"  <XAxis dataPoints={dataPoints} />",
					"  <Tooltip />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof DragNegativeExample>;

export const DragBelowZero: Story = {};
