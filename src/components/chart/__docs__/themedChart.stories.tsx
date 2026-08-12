import type { Meta, StoryObj } from "@storybook/react";
import ThemedExample, { customTheme } from "./themed-example";

const meta: Meta<typeof ThemedExample> = {
	title: "Chart/Themed",
	component: ThemedExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"`theme` è un override parziale (deep-merge sul default): basta specificare cosa cambia.",
					"",
					"```tsx",
					'import { Chart, Bar, Line, XAxis, YAxis } from "tscharts";',
					"",
					'const theme = { seriesColors: ["#6366f1", "#ec4899"] };',
					"",
					"<Chart elements={elements} theme={theme}>",
					'  <YAxis name="vendite" showGrid />',
					'  <Bar name="vendite" showLabels />',
					'  <Line name="obiettivo" dashed />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof ThemedExample>;

export const CustomTheme: Story = {
	args: {
		theme: customTheme,
	},
};

export const DefaultTheme: Story = {
	args: {
		theme: {},
	},
};
