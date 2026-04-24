import type { Meta, StoryObj } from "@storybook/react";
import Example from "./stacked-example";

const meta: Meta<typeof Example> = {
	title: "Bar Chart/Stacked",
	component: Example,
};

export default meta;

type Story = StoryObj<typeof Example>;

export const Stacked: Story = {
	args: {
		name: "tempi migliori",
		stacked: true,
		showLabels: false,
		config: {
			barWidth: 40,
		},
	},
};
