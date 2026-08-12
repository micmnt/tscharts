import type { Meta, StoryObj } from "@storybook/react";
import DeprecatedAliasExample from "./deprecated-alias-example";

const meta: Meta<typeof DeprecatedAliasExample> = {
	title: "Axis/Deprecated alias",
	component: DeprecatedAliasExample,
	parameters: {
		docs: {
			description: {
				component: [
					"## Usage",
					"",
					'`<Axis type="...">` è **deprecato** (delega a `<XAxis>`/`<YAxis>`, avvisa in console, rimosso nella 2.0). Usa i componenti dedicati:',
					"",
					"```tsx",
					'import { Chart, Bar, XAxis, YAxis } from "tscharts";',
					"",
					"<Chart elements={elements}>",
					'  <YAxis name="vendite" />           {/* invece di <Axis type="yAxis"> */}',
					'  <Bar name="vendite" />',
					'  <XAxis dataPoints={dataPoints} /> {/* invece di <Axis type="xAxis"> */}',
					"</Chart>",
					"```",
				].join("\n"),
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof DeprecatedAliasExample>;

// <Axis type="..."> e' deprecato ma ancora funzionante (delega a XAxis/YAxis).
// Apri la console: c'e' un avviso di deprecation per ciascuna istanza <Axis>.
export const DeprecatedAlias: Story = {};
