import type { FC } from "react";
import type { Serie } from "../../../types";
import XAxis from "../../axis/xAxis";
import YAxis from "../../axis/yAxis";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
import Bar from "../bar";

const values = [
	120, 180, 90, 210, 150, 170, 130, 200, 110, 160, 190, 140, 175, 125, 205, 145,
	165, 185, 100, 155, 195, 135, 215, 105, 170, 150, 180, 120, 160, 190,
];

const label = (index: number) => `g${index + 1}`;

const buildElements = (count: number): Serie[] => [
	{
		name: "vendite",
		type: "bar",
		uom: "€",
		data: Array.from({ length: count }, (_, index) => ({
			date: label(index),
			value: values[index % values.length],
		})),
	},
];

type AutoBarWidthProps = {
	pointsCount?: number;

	barWidth?: number | "auto";
};

const AutoBarWidthExample: FC<AutoBarWidthProps> = ({
	pointsCount = 8,
	barWidth = "auto",
}) => {
	const elements = buildElements(pointsCount);
	const dataPoints = Array.from({ length: pointsCount }, (_, index) =>
		label(index),
	);

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={520} height={400} elements={elements} barWidth={barWidth}>
				<YAxis name="vendite" showLine showName />
				<Bar name="vendite" radius={3} />
				<XAxis name="giorno" dataPoints={dataPoints} showLine showName />
				<Tooltip />
				<Legend height={60} showDots />
			</Chart>
		</div>
	);
};

export default AutoBarWidthExample;
