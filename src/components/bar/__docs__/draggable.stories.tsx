import type { Meta, StoryObj } from "@storybook/react";
import DragExample from "./drag-example";

const meta: Meta<typeof DragExample> = {
	title: "Bar Chart/Draggable",
	component: DragExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"`onBarDrag` rende ogni barra trascinabile in verticale; riceve il nuovo valore.",
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements} barWidth={28}>",
					'  <YAxis name="tempi migliori" />',
					'  <Bar name="tempi migliori" onBarDrag={(payload) => console.log(payload.value)} />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type DragStory = StoryObj<typeof DragExample>;

export const Draggable: DragStory = {
	args: {
		name: "tempi migliori",
		showLabels: true,
		barWidth: 40,
		dragValueDecimals: 3,
	},
};
