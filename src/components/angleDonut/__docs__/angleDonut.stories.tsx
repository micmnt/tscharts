import type { Meta, StoryObj } from "@storybook/react";
import Example from "./example";

const meta: Meta<typeof Example> = {
	title: "AngleDonut Chart",
	component: Example,
};

export default meta;
type Story = StoryObj<typeof Example>;

export const Simple: Story = {
	args: {
		name: "kpi",
		config: {
			innerRadius: 18,
			showTrack: true,
			customLabel: (el) => (
				<div
					style={{
						fontFamily: "sans-serif",
						fontSize: 11,
						color: "#151b23",
						textAlign: "right",
						width: "100%",
					}}
				>
					{el.name}: {el.value}/{el.maxValue}
				</div>
			),
		},
	},
};
