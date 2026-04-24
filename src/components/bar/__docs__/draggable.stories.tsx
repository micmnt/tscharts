import type { Meta, StoryObj } from "@storybook/react";
import DragExample from "./drag-example";

const meta: Meta<typeof DragExample> = {
	title: "Bar Chart/Draggable",
	component: DragExample,
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
