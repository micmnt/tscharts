import type { Meta, StoryObj } from "@storybook/react";
import SelectionExample from "./selection-example";

const meta: Meta<typeof SelectionExample> = {
	title: "Axis/Selection",
	component: SelectionExample,
	argTypes: {
		selectedValue: {
			control: { type: "select" },
			options: ["13/03", "14/03", "15/03", "16/03"],
		},
		selectedColor: { control: { type: "color" } },
	},
};

export default meta;

type Story = StoryObj<typeof SelectionExample>;

// selectedValue/selectedColor evidenziano la categoria; onLabelClick logga in
// console il click sulla label (apri la console).
export const Selection: Story = {
	args: {
		selectedValue: "15/03",
		selectedColor: "#6366f1",
	},
};
