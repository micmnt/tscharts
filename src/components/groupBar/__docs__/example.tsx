import React, { type FC } from "react";
import Axis from "../../axis/axis";
import Chart from "../../chart/chart";
import GroupBar, { type GroupBarProps } from "../groupBar";

const elements = [
	{
		name: "prodotto A",
		type: "group-bar",
		axisName: "vendite",
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
		axisName: "vendite",
		uom: "u",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: 8 },
			{ date: "2024-03-14T14:33:16.796Z", value: 14 },
			{ date: "2024-03-15T14:33:16.796Z", value: 16 },
			{ date: "2024-03-16T14:33:16.796Z", value: 11 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03", "16/03"];

const Example: FC<GroupBarProps> = ({
	name = "prodotto A",
	showLabels = false,
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
			<Chart width={400} height={400} elements={elements}>
				<Axis type="yAxis" name="vendite" showLine showName />
				<GroupBar name={name} showLabels={showLabels} config={config} />
				<GroupBar name="prodotto B" showLabels={showLabels} config={config} />
				<Axis type="xAxis" dataPoints={dataPoints} showLine />
			</Chart>
		</div>
	);
};

export default Example;
