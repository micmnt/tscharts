import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";
import DragExample from "./drag-example";

const meta: Meta<typeof Example> = {
	title: "Bar Chart",
	component: Example,
};

export default meta;

type Story = StoryObj<typeof Example>;

export const Simple: Story = {
	args: {
		name: "tempi migliori",
		stacked: false,
		showLabels: false,
		config: {
			barWidth: 40,
		},
	},
};

export const Draggable: StoryObj<typeof DragExample> = {
	render: (args) => <DragExample {...args} />,
	args: {
		name: "tempi migliori",
		showLabels: true,
		barWidth: 28,
		dragValueDecimals: 3,
	},
};
