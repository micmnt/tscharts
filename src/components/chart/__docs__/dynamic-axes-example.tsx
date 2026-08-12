import React, { type FC } from "react";
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
		axisName: "vendite",
		uom: "€",
		data: [
			{ date: "13/03", value: 120 },
			{ date: "14/03", value: 180 },
			{ date: "15/03", value: 90 },
		],
	},
	{
		name: "temperatura",
		type: "line",
		uom: "°C",
		data: [
			{ date: "13/03", value: 18 },
			{ date: "14/03", value: 22 },
			{ date: "15/03", value: 19 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03"];

const yAxes = ["vendite", "temperatura"];

const DynamicAxesExample: FC = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={520} height={400} elements={elements}>
				{yAxes.map((axisName) => (
					<YAxis key={axisName} name={axisName} showLine showName />
				))}
				<Bar name="vendite" />
				<Line name="temperatura" showDots />
				<XAxis name="giorno" dataPoints={dataPoints} showLine showName />
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default DynamicAxesExample;
