import type { FC } from "react";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Tooltip from "../../tooltip/tooltip";
import XAxis from "../xAxis";
import YAxis from "../yAxis";

const elements = [
	{
		name: "saturazione",
		type: "line",
		uom: "%",
		data: [
			{ date: "10:00", value: 98.2 },
			{ date: "10:05", value: 99.1 },
			{ date: "10:10", value: 100.4 },
			{ date: "10:15", value: 99.6 },
			{ date: "10:20", value: 101.3 },
			{ date: "10:25", value: 100.1 },
		],
	},
];

const dataPoints = ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25"];

type YDomainExampleProps = {
	min?: number;
	max?: number;
};

const YDomainExample: FC<YDomainExampleProps> = ({ min, max }) => {
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
				<YAxis
					name="saturazione"
					min={min}
					max={max}
					showLine
					showGrid
					showName
				/>
				<Line name="saturazione" showDots />
				<XAxis dataPoints={dataPoints} showLine showName name="ora" />
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

export default YDomainExample;
