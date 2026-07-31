import type { Meta, StoryObj } from "@storybook/react";
import MultiAxisExample from "./multi-axis-example";

const meta: Meta<typeof MultiAxisExample> = {
	title: "Axis/Multi-axis",
	component: MultiAxisExample,
};

export default meta;
type Story = StoryObj<typeof MultiAxisExample>;

export const TwoAxes: Story = {};
