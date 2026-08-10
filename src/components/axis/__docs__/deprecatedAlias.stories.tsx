import type { Meta, StoryObj } from "@storybook/react";
import DeprecatedAliasExample from "./deprecated-alias-example";

const meta: Meta<typeof DeprecatedAliasExample> = {
	title: "Axis/Deprecated alias",
	component: DeprecatedAliasExample,
};

export default meta;

type Story = StoryObj<typeof DeprecatedAliasExample>;

// <Axis type="..."> e' deprecato ma ancora funzionante (delega a XAxis/YAxis).
// Apri la console: c'e' un avviso di deprecation per ciascuna istanza <Axis>.
export const DeprecatedAlias: Story = {};
