import type { Meta, StoryObj } from "@storybook/react";
import SparklineCardExample from "./sparkline-card-example";
import SparklineExample from "./sparkline-example";

const meta: Meta = {
	title: "Line Chart/Sparkline",
};

export default meta;

type Story = StoryObj;

// Sparkline = composizione, non un componente a se': <Chart> compatto senza
// assi + <Line fillGradient>. Vedi sparkline-example.tsx per la ricetta.
export const InTable: Story = {
	render: () => <SparklineExample />,
};

// La stessa sparkline dentro una card KPI.
export const InCard: Story = {
	render: () => <SparklineCardExample />,
};
