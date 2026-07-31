import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";

const meta: Meta<typeof Example> = {
	title: "Donut Chart",
	component: Example,
};

export default meta;
type Story = StoryObj<typeof Example>;

export const Simple: Story = {
	args: {
		name: "numero utenti",
		config: {
			innerRadius: 60,
			centerElement: {
				value: "81%",
				valueColor: "#151b23",
				valueSize: 24,
				label: "utenti paganti",
				labelColor: "#4b5563",
				labelSize: 12,
			},
		},
	},
};
