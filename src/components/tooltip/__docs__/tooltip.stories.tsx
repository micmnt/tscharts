import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";

const meta: Meta<typeof Example> = {
	title: "Line Chart/With Tooltip",
	component: Example,
	argTypes: {
		showGrid: { control: { type: "boolean" } },
		title: { control: { type: "text" } },
	},
};

export default meta;
type Story = StoryObj<typeof Example>;

export const Simple: Story = {
	args: {
		name: "tempi migliori",
		showGrid: false,
	},
};

export const WithGrid: Story = {
	args: {
		name: "tempi migliori",
		showGrid: true,
	},
};
