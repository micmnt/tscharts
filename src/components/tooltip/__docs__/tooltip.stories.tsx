import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";

const meta: Meta<typeof Example> = {
	title: "Line Chart with Tooltip",
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

// Tooltip con le righe guida (showGrid): seguono il mouse insieme al tooltip.
export const WithGrid: Story = {
	args: {
		name: "tempi migliori",
		showGrid: true,
	},
};
