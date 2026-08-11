import type { FC } from "react";
import Chart from "../../chart/chart";
import Line from "../line";

// Sparkline dentro una card KPI: sempre pura composizione (Chart compatto senza
// assi + Line fillGradient), qui a piena larghezza in fondo alla card.
const data = [18, 22, 19, 26, 24, 31, 28, 35, 33, 41].map((v, i) => ({
	date: String(i),
	value: v,
}));

const color = "#6366f1";

const SparklineCardExample: FC = () => (
	<div
		style={{
			fontFamily: "system-ui, sans-serif",
			width: 260,
			border: "1px solid #e3e8ee",
			borderRadius: 14,
			padding: 20,
			boxShadow: "0 1px 3px rgba(16,24,40,.06)",
			background: "#fff",
		}}
	>
		<div style={{ fontSize: 13, color: "#667085" }}>Ricavi mensili</div>
		<div
			style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}
		>
			<div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em" }}>
				€ 48.2k
			</div>
			<div style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>
				+12.4%
			</div>
		</div>
		<div style={{ marginTop: 14, marginBottom: -6 }}>
			<Chart
				width={220}
				height={44}
				elements={[{ name: "s", type: "line", data }]}
				theme={{ padding: 3, seriesColors: [color] }}
			>
				<Line name="s" fillGradient />
			</Chart>
		</div>
	</div>
);

export default SparklineCardExample;
