import type { Meta, StoryObj } from "@storybook/react";
import NegativeExample from "./negative-example";

const meta: Meta<typeof NegativeExample> = {
	title: "Threshold Chart/Negative",
	component: NegativeExample,
};

export default meta;

type Story = StoryObj<typeof NegativeExample>;

export const Negative: Story = {};
