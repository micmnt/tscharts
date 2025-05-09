import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";

const meta: Meta<typeof Example> = {
	title: "Line Chart",
	component: Example,
};

export default meta;
type Story = StoryObj<typeof Example>;

export const Simple: Story = {
	args: {
		name: "tempi migliori",
		showDots: false,
		showLabels: false,
		hideLine: false,
	},
};
