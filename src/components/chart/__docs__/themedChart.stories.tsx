import type { Meta, StoryObj } from "@storybook/react";
import ThemedExample, { customTheme } from "./themed-example";

const meta: Meta<typeof ThemedExample> = {
	title: "Chart/Themed",
	component: ThemedExample,
};

export default meta;

type Story = StoryObj<typeof ThemedExample>;

// Tema custom (override parziale sul default).
export const CustomTheme: Story = {
	args: {
		theme: customTheme,
	},
};

// Oggetto vuoto → il merge ritorna il tema di default: stessa scena col tema
// standard, per confronto a colpo d'occhio con quella custom qui sopra.
export const DefaultTheme: Story = {
	args: {
		theme: {},
	},
};
