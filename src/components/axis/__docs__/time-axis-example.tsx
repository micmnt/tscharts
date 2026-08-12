import type { FC } from "react";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Tooltip from "../../tooltip/tooltip";
import XAxis from "../xAxis";
import YAxis from "../yAxis";

const elements = [
	{
		name: "vendite",
		type: "line",
		uom: "€",
		data: [
			{ date: "2024-01-01", value: 120 },
			{ date: "2024-01-03", value: 180 },
			{ date: "2024-01-04", value: 90 },
			{ date: "2024-01-20", value: 210 },
			{ date: "2024-02-18", value: 140 },
		],
	},
];

const parseDate = (d: string) => new Date(d).getTime();

type TimeAxisExampleProps = {
	ticks?: "data" | number;
};

const TimeAxisExample: FC<TimeAxisExampleProps> = ({ ticks = "data" }) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
			}}
		>
			<Chart width={560} height={400} elements={elements}>
				<YAxis name="vendite" showLine showName />
				<Line name="vendite" showDots />
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
