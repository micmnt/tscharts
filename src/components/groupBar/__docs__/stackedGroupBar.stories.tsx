import type { Meta, StoryObj } from "@storybook/react";
import StackedExample from "./stacked-example";

const meta: Meta<typeof StackedExample> = {
	title: "GroupBar Chart/Stacked",
	component: StackedExample,
};

export default meta;

type Story = StoryObj<typeof StackedExample>;

export const Stacked: Story = {
	args: {
		showLabels: false,
	},
};
