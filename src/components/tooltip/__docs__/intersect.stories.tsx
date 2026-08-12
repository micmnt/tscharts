import type { Meta, StoryObj } from "@storybook/react";
import IntersectExample from "./intersect-example";

const meta: Meta<typeof IntersectExample> = {
	title: "Tooltip/Intersect",
	component: IntersectExample,
	argTypes: {
		intersect: { control: { type: "boolean" } },
	},
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"`intersect`: `false` (default) il tooltip segue la colonna più vicina; `true` appare solo quando il mouse è sopra la barra.",
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis, Tooltip } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />',
					'  <Bar name="vendite" />',
					"  <XAxis dataPoints={dataPoints} />",
					"  <Tooltip intersect />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof IntersectExample>;

export const Proximity: Story = {
	args: { intersect: false },
};

export const Intersect: Story = {
	args: { intersect: true },
};
