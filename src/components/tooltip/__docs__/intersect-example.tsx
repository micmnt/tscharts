import React, { type FC } from "react";
import Axis from "../../axis/axis";
import Bar from "../../bar/bar";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../tooltip";

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

// `intersect` come control: false (default) = tooltip a prossimita' (segue la
// colonna piu' vicina); true = compare solo quando il mouse e' sopra la barra.
type IntersectExampleProps = {
	intersect?: boolean;
};

const IntersectExample: FC<IntersectExampleProps> = ({ intersect = false }) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={480} height={400} elements={elements} barWidth={22}>
				<Axis type="yAxis" name="vendite" showLine showName />
				<Bar name="vendite" />
				<Axis
					type="xAxis"
					name="giorno"
					dataPoints={dataPoints}
					showLine
					showName
				/>
				<Tooltip intersect={intersect} showGrid />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default IntersectExample;
