import React, { type FC } from "react";
import XAxis from "../../axis/xAxis";
import YAxis from "../../axis/yAxis";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
import Bar from "../bar";

const elements = [
	{
		name: "vendite",
		type: "bar",
		uom: "€",
		data: [
			{ date: "13/03", value: 120 },
			{ date: "14/03", value: 180 },
			{ date: "15/03", value: 90 },
			{ date: "16/03", value: 210 },
		],
	},
];

const dataPoints = ["13/03", "14/03", "15/03", "16/03"];

type DynamicBarWidthProps = {
	barWidth?: number;
};

const DynamicBarWidthExample: FC<DynamicBarWidthProps> = ({
	barWidth = 12,
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
			<Chart width={480} height={400} elements={elements} barWidth={barWidth}>
				<YAxis name="vendite" showLine showName />
				<Bar name="vendite" />
				<XAxis name="giorno" dataPoints={dataPoints} showLine showName />
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default DynamicBarWidthExample;
