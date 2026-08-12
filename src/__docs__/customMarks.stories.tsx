import type { Meta, StoryObj } from "@storybook/react";
import { CustomMarksExample } from "./custom-marks-example";

const meta: Meta<typeof CustomMarksExample> = {
	title: "Custom marks",
	component: CustomMarksExample,
};

export default meta;

type Story = StoryObj<typeof CustomMarksExample>;

export const Diamonds: Story = {
	args: { variant: "diamonds" },
};

export const Candlestick: Story = {
	args: { variant: "candlestick" },
};

export const CanvasAccelerated: Story = {
	args: { variant: "canvas" },
};

export const Negative: Story = {
	args: { variant: "negative" },
};

export const Horizontal: Story = {
	args: { variant: "horizontal" },
};
