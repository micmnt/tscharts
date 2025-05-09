import React, { type FC } from "react";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Pie, { type PieProps } from "../pie";

const series = [
	{
		name: "numero utenti",
		type: "pie",
		data: [
			{
				name: "utenti paganti",
				value: 1942,
				label: "68%",
			},
			{
				name: "utenti non paganti",
				value: 456,
				label: "32%",
			},
		],
		labels: [
			{ name: "utenti paganti", value: "68%" },
			{ name: "utenti non paganti", value: "32%" },
		],
	},
];

const Example: FC<PieProps> = ({ name = "numero utenti" }) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={400} height={200} elements={series}>
				<Pie name={name} />
				<Legend legendType="vertical" height={90} />
			</Chart>
		</div>
	);
};

export default Example;
