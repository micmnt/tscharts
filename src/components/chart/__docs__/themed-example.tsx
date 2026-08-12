import React, { type FC } from "react";
import type { ThemeState } from "../../../types";
import XAxis from "../../axis/xAxis";
import YAxis from "../../axis/yAxis";
import Bar from "../../bar/bar";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Tooltip from "../../tooltip/tooltip";
import Chart from "../chart";

const elements = [
	{
		name: "vendite",
		type: "bar",
		uom: "€",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: 120 },
			{ date: "2024-03-14T14:33:16.796Z", value: 180 },
			{ date: "2024-03-15T14:33:16.796Z", value: 90 },
			{ date: "2024-03-16T14:33:16.796Z", value: 210 },
		],
	},
	{
		name: "obiettivo",
		type: "line",

		axisName: "vendite",
		uom: "€",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: 150 },
			{ date: "2024-03-14T14:33:16.796Z", value: 150 },
			{ date: "2024-03-15T14:33:16.796Z", value: 150 },
			{ date: "2024-03-16T14:33:16.796Z", value: 150 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03", "16/03"];

export const customTheme: Partial<ThemeState> = {
	padding: 32,
	seriesColors: ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b"],
	grid: { color: "#e5e7eb", dashed: true },
	axis: { color: "#cbd5e1", labelColor: "#64748b", titleColor: "#0f172a" },
	legend: { textColor: "#334155", textSize: 13 },
};

type ThemedExampleProps = {
	theme: Partial<ThemeState>;
};

const ThemedExample: FC<ThemedExampleProps> = ({ theme }) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={480} height={400} elements={elements} theme={theme}>
				<YAxis name="vendite" showGrid showLine showName />
				<Bar name="vendite" showLabels />
				<Line name="obiettivo" dashed />
				<XAxis name="giorno" dataPoints={dataPoints} showLine showName />
				<Tooltip showGrid />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default ThemedExample;
