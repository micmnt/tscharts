import type { FC } from "react";
import type { Serie } from "../../../types";
import Bar from "../../bar/bar";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Tooltip from "../../tooltip/tooltip";
import XAxis from "../xAxis";
import YAxis from "../yAxis";

const data = [
	{ date: "2024-01-01", value: 120 },
	{ date: "2024-01-03", value: 180 },
	{ date: "2024-01-04", value: 90 },
	{ date: "2024-01-20", value: 210 },
	{ date: "2024-02-18", value: 140 },
];

const parseDate = (d: string) => new Date(d).getTime();

type TimeAxisExampleProps = {
	ticks?: "data" | number;

	serieType?: "line" | "bar";
};

const TimeAxisExample: FC<TimeAxisExampleProps> = ({
	ticks = "data",
	serieType = "line",
}) => {
	const elements: Serie[] = [
		{ name: "vendite", type: serieType, uom: "€", data },
	];

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={560} height={400} elements={elements} barWidth={14}>
				<YAxis name="vendite" showLine showName />
				{serieType === "bar" ? (
					<Bar name="vendite" radius={3} />
				) : (
					<Line name="vendite" showDots />
				)}
				<XAxis
					scaleType="time"
					parseDate={parseDate}
					ticks={ticks}
					tickFormat={
						ticks === "data"
							? undefined
							: (t) => new Date(t).toLocaleDateString("it-IT")
					}
					showLine
					showName
					tiltLabels
					name="data"
				/>
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default TimeAxisExample;
