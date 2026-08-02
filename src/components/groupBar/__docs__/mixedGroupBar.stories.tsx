import type { Meta, StoryObj } from "@storybook/react";
import MixedExample from "./mixed-example";

const meta: Meta<typeof MixedExample> = {
	title: "GroupBar Chart/Mixed",
	component: MixedExample,
};

export default meta;

type Story = StoryObj<typeof MixedExample>;

export const Mixed: Story = {
	args: {
		showLabels: true,
	},
};
