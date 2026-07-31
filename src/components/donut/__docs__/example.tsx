import React, { type FC } from "react";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
import Donut, { type DonutProps } from "../donut";

const series = [
	{
		name: "numero utenti",
		type: "donut",
		data: [
			{ name: "utenti paganti", value: 1942 },
			{ name: "utenti non paganti", value: 456 },
		],
		labels: [
			{ name: "utenti paganti", value: "68%" },
			{ name: "utenti non paganti", value: "32%" },
		],
	},
];

const Example: FC<DonutProps> = ({ name = "numero utenti", config = {} }) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={400} height={250} elements={series}>
				<Donut name={name} config={config} />
				<Legend legendType="vertical" height={90} showDots />
				<Tooltip />
			</Chart>
		</div>
	);
};

export default Example;
