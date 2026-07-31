import type { Meta, StoryObj } from "@storybook/react";
import HorizontalExample from "./horizontal-example";

const meta: Meta<typeof HorizontalExample> = {
	title: "Line Chart/Horizontal",
	component: HorizontalExample,
};

export default meta;

type Story = StoryObj<typeof HorizontalExample>;

export const Horizontal: Story = {};
