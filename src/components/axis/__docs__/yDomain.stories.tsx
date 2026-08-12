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

// Dominio automatico [0, max]: la line 98-102 e' schiacciata in cima, le
// oscillazioni sono quasi invisibili.
export const AutoDomain: Story = {
	args: {},
};

// Dominio controllato [98, 102]: si "entra" nella banda e le oscillazioni
// diventano leggibili. I valori fuori intervallo verrebbero clampati ai bordi.
export const ZoomedDomain: Story = {
	args: { min: 98, max: 102 },
};
