import { useMemo, useState } from "react";
import XAxis from "../components/axis/xAxis";
import YAxis from "../components/axis/yAxis";
import Bar from "../components/bar/bar";
import Chart from "../components/chart/chart";
import Legend from "../components/legend/legend";
import Line from "../components/line/line";
import Tooltip from "../components/tooltip/tooltip";

type Pt = { date: string; value: number };

const genScatter = (n: number): Pt[] => {
	const data: Pt[] = [];
	let v = 50;
	for (let i = 0; i < n; i++) {
		v += (Math.random() - 0.5) * 6;
		v = Math.max(2, Math.min(98, v));
		data.push({ date: String(i), value: Number(v.toFixed(1)) });
	}
	return data;
};

const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu"];
const baseBars = [40, 65, 50, 80, 60, 72];

export const CanvasExample = ({ variant }: { variant: "scatter" | "bars" }) => {
	const scatter = useMemo(() => genScatter(2000), []);
	const [barValues, setBarValues] = useState(baseBars);
	const [log, setLog] = useState(
		"Clicca o trascina una barra (anche da tastiera: Tab + Invio)",
	);

	if (variant === "scatter") {
		return (
			<Chart
				renderer="canvas"
				width={760}
				height={360}
				elements={[{ name: "segnale", type: "line", uom: "", data: scatter }]}
			>
				<YAxis name="segnale" showName showLine />
				<Line name="segnale" showDots fillGradient />
				<XAxis
					scaleType="time"
					parseDate={Number}
					ticks={7}
					tickFormat={(t) => `t${Math.round(t)}`}
					showLine
				/>
				<Legend />
				<Tooltip />
			</Chart>
		);
	}

	const elements = [
		{
			name: "vendite",
			type: "bar" as const,
			uom: "€",
			data: months.map((m, i) => ({ date: m, value: barValues[i] })),
		},
	];

	return (
		<div style={{ fontFamily: "system-ui" }}>
			<Chart renderer="canvas" width={620} height={340} elements={elements}>
				<YAxis name="vendite" showName showLine />
				<Bar
					name="vendite"
					radius={4}
					showLabels
					labelColor="#fff"
					onBarClick={(v) => setLog(`click: ${JSON.stringify(v)}`)}
					onBarDrag={({ index, value }) => {
						setBarValues((prev) => {
							const next = [...prev];
							next[index] = Math.round(value);
							return next;
						});
						setLog(`drag: [${index}] → ${Math.round(value)}`);
					}}
				/>
				<XAxis dataPoints={months} showLine />
				<Legend />
				<Tooltip />
			</Chart>
			<p style={{ fontSize: 13, color: "#555" }}>{log}</p>
		</div>
	);
};
