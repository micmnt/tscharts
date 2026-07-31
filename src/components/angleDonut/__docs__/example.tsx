import React, { type FC } from "react";
import Chart from "../../chart/chart";
import AngleDonut, { type AngleDonutProps } from "../angleDonut";

const elements = [
	{
		type: "angle-donut",
		name: "kpi",
		data: [
			{ name: "obiettivo A", value: 70, maxValue: 100 },
			{ name: "obiettivo B", value: 45, maxValue: 100 },
			{ name: "obiettivo C", value: 90, maxValue: 100 },
		],
	},
];

const Example: FC<AngleDonutProps> = ({ name = "kpi", config = {} }) => {
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
				<AngleDonut name={name} config={config} />
			</Chart>
		</div>
	);
};

export default Example;
