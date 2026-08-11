import type { FC } from "react";
import XAxis from "../../axis/xAxis";
import YAxis from "../../axis/yAxis";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Tooltip from "../../tooltip/tooltip";
import Line from "../line";

// Un area chart NON e' un componente a se': e' una <Line> con riempimento
// (fill + fillOpacity, oppure fillGradient). Qui tre varianti che riusano lo
// stesso primitivo componibile.
const dataPoints = ["gen", "feb", "mar", "apr", "mag", "giu"];

type AreaExampleProps = {
	variant?: "normal" | "gradient" | "negative" | "dual";
};

const AreaExample: FC<AreaExampleProps> = ({ variant = "normal" }) => {
	if (variant === "dual") {
		// Doppio asse Y con due aree miste (positivi + negativi): i grafici
		// negativi condividono la linea dello zero a meta' canvas, quindi le due
		// aree semi-trasparenti si sovrappongono e si vedono le intersezioni.
		const elements = [
			{
				name: "ricavi",
				type: "line",
				axisName: "ricavi",
				uom: "k€",
				data: [22, -8, 30, 12, -14, 26].map((value, i) => ({
					date: dataPoints[i],
					value,
				})),
			},
			{
				name: "margine",
				type: "line",
				axisName: "margine",
				uom: "%",
				data: [-6, 10, -4, 8, 14, -10].map((value, i) => ({
					date: dataPoints[i],
					value,
				})),
			},
		];
		return (
			<div style={centered}>
				<Chart width={620} height={400} elements={elements}>
					<YAxis name="ricavi" showLine showName />
					<YAxis name="margine" showLine showName />
					<Line name="ricavi" fill="#6366f1" fillOpacity={0.3} showDots />
					<Line name="margine" fill="#ec4899" fillOpacity={0.3} showDots />
					<XAxis dataPoints={dataPoints} showLine showName name="mese" />
					<Tooltip />
					<Legend legendType="horizontal" height={60} showDots />
				</Chart>
			</div>
		);
	}

	const values =
		variant === "negative"
			? [30, -20, 45, -10, 25, -35]
			: [40, 62, 51, 78, 69, 90];

	const elements = [
		{
			name: "vendite",
			type: "line",
			uom: "€",
			data: values.map((value, i) => ({ date: dataPoints[i], value })),
		},
	];

	// L'area sfumata usa la stessa prop della sparkline: fillGradient.
	const gradient = variant === "gradient";

	return (
		<div style={centered}>
			<Chart width={560} height={400} elements={elements}>
				<YAxis name="vendite" showLine showGrid showName />
				<Line
					name="vendite"
					fill="#14b8a6"
					fillOpacity={gradient ? 0.35 : 0.25}
					fillGradient={gradient}
					showDots
				/>
				<XAxis dataPoints={dataPoints} showLine showName name="mese" />
				<Tooltip />
				<Legend legendType="horizontal" height={60} showDots />
			</Chart>
		</div>
	);
};

const centered = {
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	height: "100%",
} as const;

export default AreaExample;
