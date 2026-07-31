import type { Meta, StoryObj } from "@storybook/react";
import DragNegativeExample from "./drag-negative-example";

const meta: Meta<typeof DragNegativeExample> = {
	title: "Bar Chart/Draggable Negative",
	component: DragNegativeExample,
};

export default meta;
type Story = StoryObj<typeof DragNegativeExample>;

export const DragBelowZero: Story = {};
