import type { Meta, StoryObj } from "@storybook/react";
import { CanvasExample } from "./canvas-example";

const meta: Meta<typeof CanvasExample> = {
	title: "Canvas renderer",
	component: CanvasExample,
};

export default meta;

type Story = StoryObj<typeof CanvasExample>;

export const Scatter: Story = {
	args: { variant: "scatter" },
};

export const InteractiveBars: Story = {
	args: { variant: "bars" },
};
