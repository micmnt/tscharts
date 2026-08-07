import React, { type FC } from "react";
import Axis from "../../axis/axis";
import Bar from "../../bar/bar";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Tooltip from "../../tooltip/tooltip";
import Chart from "../chart";

// Due serie su due assi Y distinti (left/right). L'asse Y "temperatura" va a
// destra: perche' resti a destra servono DUE assi Y contati correttamente.
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

// Assi Y generati dinamicamente con .map: l'ispezione dei children scende
// dentro array e Fragment (flattenChildren), quindi il layout riserva
// correttamente lo spazio per entrambi gli assi.
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
					<Axis key={axisName} type="yAxis" name={axisName} showLine showName />
				))}
				<Bar name="vendite" />
				<Line name="temperatura" showDots />
				<Axis
					type="xAxis"
					name="giorno"
					dataPoints={dataPoints}
					showLine
					showName
				/>
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default DynamicAxesExample;
