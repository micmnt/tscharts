import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";

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

		barWidth: 40,
		onBarClick: (value: unknown) => console.log("[onBarClick]", value),
	},
};
