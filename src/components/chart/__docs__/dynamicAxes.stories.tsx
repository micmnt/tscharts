import type { Meta, StoryObj } from "@storybook/react";
import DynamicAxesExample from "./dynamic-axes-example";

const meta: Meta<typeof DynamicAxesExample> = {
	title: "Chart/Dynamic axes (.map)",
	component: DynamicAxesExample,
};

export default meta;

type Story = StoryObj<typeof DynamicAxesExample>;

export const DynamicAxes: Story = {};
