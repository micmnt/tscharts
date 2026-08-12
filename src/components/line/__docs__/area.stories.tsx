import type { Meta, StoryObj } from "@storybook/react";
import AreaExample from "./area-example";

const meta: Meta<typeof AreaExample> = {
	title: "Line Chart/Area",
	component: AreaExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Un'area chart è una `<Line>` con riempimento: `fill` + `fillOpacity`, oppure `fillGradient` (sfumato).",
					"",
					"```tsx",
					'import { Chart, Line, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="ricavi" />',
					'  <Line name="ricavi" fill="#6366f1" fillOpacity={0.3} showDots />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof AreaExample>;

export const Normal: Story = {
	args: { variant: "normal" },
};

export const Gradient: Story = {
	args: { variant: "gradient" },
};

export const Negative: Story = {
	args: { variant: "negative" },
};

export const DualMixed: Story = {
	args: { variant: "dual" },
};
