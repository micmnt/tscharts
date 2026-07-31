import React, { type FC } from "react";
import Axis from "../../axis/axis";
import Bar from "../../bar/bar";
import Chart from "../../chart/chart";
import Tooltip from "../../tooltip/tooltip";
import Threshold from "../threshold";

const elements = [
	{
		type: "bar",
		name: "variazione",
		uom: "%",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: -50 },
			{ date: "2024-03-14T14:33:16.796Z", value: 30 },
			{ date: "2024-03-15T14:33:16.796Z", value: 80 },
			{ date: "2024-03-16T14:33:16.796Z", value: -20 },
			{ date: "2024-03-17T14:33:16.796Z", value: 60 },
		],
	},
	{
		type: "threshold",
		name: "media",
		data: 60,
	},
];

const dataPoints = ["13/03", "14/03", "15/03", "16/03", "17/03"];

const NegativeExample: FC = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={500} height={400} elements={elements}>
				<Axis type="yAxis" name="variazione" showLine showGrid />
				<Bar name="variazione" showLabels />
				<Threshold dashed name="media" showLabel />
				<Axis type="xAxis" dataPoints={dataPoints} showLine />
				<Tooltip />
			</Chart>
		</div>
	);
};

export default NegativeExample;
