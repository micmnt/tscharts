import React, { type FC } from "react";
import Axis from "../../axis/axis";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
import GroupBar, { type GroupBarProps } from "../groupBar";

const elements = [
	{
		name: "prodotto A",
		type: "group-bar",
		stackedName: "gruppo1",
		uom: "u",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: 12 },
			{ date: "2024-03-14T14:33:16.796Z", value: 18 },
			{ date: "2024-03-15T14:33:16.796Z", value: 9 },
			{ date: "2024-03-16T14:33:16.796Z", value: 21 },
		],
	},
	{
		name: "prodotto B",
		type: "group-bar",
		stackedName: "gruppo1",
		uom: "u",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: 8 },
			{ date: "2024-03-14T14:33:16.796Z", value: 14 },
			{ date: "2024-03-15T14:33:16.796Z", value: 16 },
			{ date: "2024-03-16T14:33:16.796Z", value: 11 },
		],
	},
	{
		name: "prodotto C",
		type: "group-bar",
		uom: "u",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: 15 },
			{ date: "2024-03-14T14:33:16.796Z", value: 10 },
			{ date: "2024-03-15T14:33:16.796Z", value: 22 },
			{ date: "2024-03-16T14:33:16.796Z", value: 13 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03", "16/03"];

// GroupBar con un gruppo stacked (A+B, stesso stackedName) e una barra
// singola non-stacked (C) nella stessa categoria.
const MixedExample: FC<GroupBarProps> = ({
	showLabels = true,
	config = {},
}) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={450} height={400} elements={elements}>
				<Axis type="yAxis" name="vendite" showLine showName />
				<GroupBar
					name="prodotto A"
					stacked
					showLabels={showLabels}
					config={config}
				/>
				<GroupBar
					name="prodotto B"
					stacked
					showLabels={showLabels}
					config={config}
				/>
				<GroupBar name="prodotto C" showLabels={showLabels} config={config} />
				<Axis
					type="xAxis"
					name="giorno"
					dataPoints={dataPoints}
					showLine
					showName
				/>
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default MixedExample;
