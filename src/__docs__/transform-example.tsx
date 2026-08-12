import type { FC } from "react";
import XAxis from "../components/axis/xAxis";
import YAxis from "../components/axis/yAxis";
import Bar from "../components/bar/bar";
import Chart from "../components/chart/chart";
import Legend from "../components/legend/legend";
import Line from "../components/line/line";
import Tooltip from "../components/tooltip/tooltip";
import { aggregate, bin, cumulative, movingAverage } from "../transform";

const centered = {
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	height: "100%",
} as const;

const noisy = [42, 55, 40, 61, 47, 66, 52, 70, 58, 74, 63, 80, 69, 86].map(
	(value, i) => ({ date: `g${i + 1}`, value }),
);

const daily = [
	{ date: "2024-01-05", value: 12 },
	{ date: "2024-01-19", value: 8 },
	{ date: "2024-02-02", value: 15 },
	{ date: "2024-02-21", value: 9 },
	{ date: "2024-03-04", value: 20 },
	{ date: "2024-03-27", value: 14 },
];

const samples = [
	3, 7, 8, 12, 13, 14, 18, 19, 21, 22, 22, 24, 27, 28, 31, 33, 34, 39, 41, 45,
].map((value, i) => ({ date: String(i), value }));

type TransformExampleProps = {
	fn?: "movingAverage" | "cumulative" | "aggregate" | "bin";
};

const TransformExample: FC<TransformExampleProps> = ({
	fn = "movingAverage",
}) => {
	if (fn === "movingAverage") {
		const smooth = movingAverage(noisy, 4);
		const dataPoints = noisy.map((p) => p.date);
		return (
			<div style={centered}>
				<Chart
					width={620}
					height={380}
					elements={[
						{ name: "grezzo", type: "line", axisName: "v", data: noisy },
						{
							name: "media mobile (4)",
							type: "line",
							axisName: "v",
							data: smooth,
						},
					]}
					theme={{ seriesColors: ["#cbd5e1", "#6366f1"] }}
				>
					<YAxis name="v" showLine showName />
					<Line name="grezzo" />
					<Line name="media mobile (4)" />
					<XAxis dataPoints={dataPoints} showLine showName name="giorno" />
					<Tooltip />
					<Legend legendType="horizontal" height={50} showDots />
				</Chart>
			</div>
		);
	}

	if (fn === "cumulative") {
		const cum = cumulative(daily);
		const dataPoints = daily.map((p) => p.date.slice(5));
		return (
			<div style={centered}>
				<Chart
					width={620}
					height={380}
					elements={[
						{ name: "valore", type: "bar", axisName: "v", data: daily },
						{ name: "cumulato", type: "line", axisName: "v", data: cum },
					]}
					theme={{ seriesColors: ["#a5b4fc", "#4f46e5"] }}
				>
					<YAxis name="v" showLine showName />
					<Bar name="valore" />
					<Line name="cumulato" showDots />
					<XAxis dataPoints={dataPoints} showLine showName name="data" />
					<Tooltip />
					<Legend legendType="horizontal" height={50} showDots />
				</Chart>
			</div>
		);
	}

	if (fn === "aggregate") {
		const monthly = aggregate(daily, { by: (p) => p.date.slice(0, 7) });
		const dataPoints = monthly.map((p) => p.date);
		return (
			<div style={centered}>
				<Chart
					width={560}
					height={380}
					elements={[{ name: "mensile", type: "bar", data: monthly }]}
					barWidth={48}
					theme={{ seriesColors: ["#14b8a6"] }}
				>
					<YAxis name="mensile" showLine showGrid showName />
					<Bar name="mensile" showLabels />
					<XAxis dataPoints={dataPoints} showLine showName name="mese" />
					<Tooltip />
				</Chart>
			</div>
		);
	}

	const hist = bin(samples, { size: 10 });
	const dataPoints = hist.map((p) => p.date);
	return (
		<div style={centered}>
			<Chart
				width={560}
				height={380}
				elements={[{ name: "frequenza", type: "bar", data: hist }]}
				barWidth={60}
				theme={{ seriesColors: ["#ec4899"] }}
			>
				<YAxis name="frequenza" showLine showGrid showName />
				<Bar name="frequenza" showLabels />
				<XAxis dataPoints={dataPoints} showLine showName name="intervallo" />
				<Tooltip />
			</Chart>
		</div>
	);
};

export default TransformExample;
