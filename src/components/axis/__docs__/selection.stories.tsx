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
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"`selectedValue`/`selectedColor` evidenziano una categoria; `onLabelClick(label, index)` gestisce il click sulle label.",
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />',
					'  <Bar name="vendite" />',
					"  <XAxis",
					'    selectedValue="15/03"',
					'    selectedColor="#6366f1"',
					"    onLabelClick={(label, index) => console.log(label, index)}",
					"  />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof SelectionExample>;

export const Selection: Story = {
	args: {
		selectedValue: "15/03",
		selectedColor: "#6366f1",
	},
};
