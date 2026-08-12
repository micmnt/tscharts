import type { Meta, StoryObj } from "@storybook/react";
import TransformExample from "./transform-example";

const meta: Meta<typeof TransformExample> = {
	title: "Transform",
	component: TransformExample,
};

export default meta;

type Story = StoryObj<typeof TransformExample>;

export const MovingAverage: Story = {
	args: { fn: "movingAverage" },
};

export const Cumulative: Story = {
	args: { fn: "cumulative" },
};

export const Aggregate: Story = {
	args: { fn: "aggregate" },
};

export const Bin: Story = {
	args: { fn: "bin" },
};
