import type { Meta, StoryObj } from "@storybook/react";
import DynamicBarWidthExample from "./dynamic-barwidth-example";

const meta: Meta<typeof DynamicBarWidthExample> = {
	title: "Bar Chart/Dynamic barWidth",
	component: DynamicBarWidthExample,
	argTypes: {
		barWidth: { control: { type: "range", min: 8, max: 70, step: 2 } },
	},
};

export default meta;

type Story = StoryObj<typeof DynamicBarWidthExample>;

export const DynamicBarWidth: Story = {
	args: {
		barWidth: 12,
	},
};
