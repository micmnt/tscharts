import type { Meta, StoryObj } from "@storybook/react";
import HorizontalExample from "./horizontal-example";

const meta: Meta<typeof HorizontalExample> = {
	title: "Bar Chart/Horizontal",
	component: HorizontalExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"Barre orizzontali: `horizontal` su `<Bar>` e sul relativo `<XAxis>`.",
					"",
					"```tsx",
					'import { Chart, Bar, XAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <Bar name="richieste" horizontal />',
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
