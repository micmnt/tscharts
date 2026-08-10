import React, { type FC } from "react";
import XAxis from "../../axis/xAxis";
import YAxis from "../../axis/yAxis";
import Chart from "../../chart/chart";
import Bar, { type BarProps } from "../bar";

const elements = [
	{
		name: "variazione",
		type: "bar",
		uom: "%",
		data: [
			{ date: "2024-03-13T14:33:16.796Z", value: 3.2 },
			{ date: "2024-03-14T14:33:16.796Z", value: -1.4 },
			{ date: "2024-03-15T14:33:16.796Z", value: 2.1 },
			{ date: "2024-03-16T14:33:16.796Z", value: -3.6 },
			{ date: "2024-03-17T14:33:16.796Z", value: 4.5 },
			{ date: "2024-03-18T14:33:16.796Z", value: -0.8 },
			{ date: "2024-03-19T14:33:16.796Z", value: 1.9 },
		],
	},
];

const dataPoints = [
	"13/03",
	"14/03",
	"15/03",
	"16/03",
	"17/03",
	"18/03",
	"19/03",
];

const NegativeExample: FC<BarProps> = ({
	name = "variazione",
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
				<YAxis name="variazione" showLine showName />
				<Bar name={name} showLabels={showLabels} config={config} />
				<XAxis dataPoints={dataPoints} showLine />
			</Chart>
		</div>
	);
};

export default NegativeExample;
