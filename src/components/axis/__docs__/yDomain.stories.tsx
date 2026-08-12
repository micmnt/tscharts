import type { Meta, StoryObj } from "@storybook/react";
import YDomainExample from "./y-domain-example";

const meta: Meta<typeof YDomainExample> = {
	title: "Axis/Y domain",
	component: YDomainExample,
	argTypes: {
		min: { control: { type: "number" } },
		max: { control: { type: "number" } },
	},
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					"`<YAxis min max>` sovrascrive il dominio auto `[0, max]`, utile per entrare in una banda stretta di valori.",
					"",
					"```tsx",
					'import { Chart, Line, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					"  <YAxis min={98} max={102} />",
					'  <Line name="saturazione" showDots />',
					"  <XAxis dataPoints={dataPoints} />",
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof YDomainExample>;

export const AutoDomain: Story = {
	args: {},
};

export const ZoomedDomain: Story = {
	args: { min: 98, max: 102 },
};
