import type { Meta, StoryObj } from "@storybook/react";
import IntersectExample from "./intersect-example";

const meta: Meta<typeof IntersectExample> = {
	title: "Tooltip/Intersect",
	component: IntersectExample,
	argTypes: {
		intersect: { control: { type: "boolean" } },
	},
};

export default meta;

type Story = StoryObj<typeof IntersectExample>;

// Prossimita' (default): il tooltip segue la colonna piu' vicina.
export const Proximity: Story = {
	args: { intersect: false },
};

// Intersect: il tooltip compare solo quando il mouse e' sopra la barra.
export const Intersect: Story = {
	args: { intersect: true },
};
