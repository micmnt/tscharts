import React, { type FC } from "react";
import Bar from "../../bar/bar";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Threshold from "../../threshold/threshold";
import Tooltip from "../../tooltip/tooltip";
import Axis from "../axis";

const elements = [
	{
		type: "bar",
		name: "vendite",
		axisName: "vendite",
		uom: "u",
		data: [
			{ date: "13/03", value: 40 },
			{ date: "14/03", value: 60 },
			{ date: "15/03", value: 30 },
		],
	},
	{
		type: "threshold",
		name: "soglia",
		axisName: "vendite",
		data: 50,
	},
	{
		type: "line",
		name: "temperatura",
		uom: "°C",
		data: [
			{ date: "13/03", value: 18 },
			{ date: "14/03", value: 22 },
			{ date: "15/03", value: 19 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03"];

const MultiAxisExample: FC = () => {
	return (
		<div style={{ display: "flex", justifyContent: "center", height: "100%" }}>
			<Chart width={500} height={350} elements={elements}>
				<Axis type="yAxis" name="vendite" showLine showName />
				<Bar name="vendite" />
				<Threshold dashed name="soglia" axisName="vendite" />
				<Axis type="yAxis" name="temperatura" showLine showName />
				<Line name="temperatura" showDots />
				<Axis type="xAxis" dataPoints={dataPoints} showLine />
				<Tooltip />
				<Legend legendType="horizontal" height={50} showDots />
			</Chart>
		</div>
	);
};

export default MultiAxisExample;
