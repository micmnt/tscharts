import type { Meta, StoryObj } from "@storybook/react";
import HorizontalExample from "./horizontal-example";

const meta: Meta<typeof HorizontalExample> = {
	title: "Line Chart/Horizontal",
	component: HorizontalExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Linea orizzontale: `horizontal` su `<Line>` e sul relativo `<XAxis>`.",
					"",
					"```tsx",
					'import { Chart, Line, XAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <Line name="richieste" horizontal showDots />',
					"  <XAxis horizontal dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof HorizontalExample>;

export const Horizontal: Story = {};
