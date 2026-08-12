import type { FC } from "react";
import Chart from "../../chart/chart";
import Line from "../line";

type SparkRow = {
	label: string;
	value: string;
	color: string;
	data: { date: string; value: number }[];
};

const rows: SparkRow[] = [
	{
		label: "Ricavi",
		value: "€ 48.2k",
		color: "#6366f1",
		data: [12, 18, 14, 22, 20, 28, 26, 34].map((v, i) => ({
			date: String(i),
			value: v,
		})),
	},
	{
		label: "Sessioni",
		value: "12.9k",
		color: "#14b8a6",
		data: [30, 28, 32, 25, 26, 22, 24, 19].map((v, i) => ({
			date: String(i),
			value: v,
		})),
	},
	{
		label: "Conversioni",
		value: "3.4%",
		color: "#ec4899",
		data: [4, 5, 4, 6, 7, 6, 8, 9].map((v, i) => ({
			date: String(i),
			value: v,
		})),
	},
];

const Sparkline: FC<{ data: SparkRow["data"]; color: string }> = ({
	data,
	color,
}) => (
	<Chart
		width={120}
		height={32}
		elements={[{ name: "s", type: "line", data }]}
		theme={{ padding: 3, seriesColors: [color] }}
	>
		<Line name="s" fillGradient />
	</Chart>
);

const SparklineExample: FC = () => (
	<div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 420 }}>
		<table style={{ width: "100%", borderCollapse: "collapse" }}>
			<tbody>
				{rows.map((row) => (
					<tr key={row.label} style={{ borderTop: "1px solid #e3e8ee" }}>
						<td style={{ padding: "10px 12px", fontSize: 14 }}>{row.label}</td>
						<td
							style={{
								padding: "10px 12px",
								fontSize: 14,
								fontWeight: 600,
								fontVariantNumeric: "tabular-nums",
							}}
						>
							{row.value}
						</td>
						<td style={{ padding: "6px 12px", width: 120 }}>
							<Sparkline data={row.data} color={row.color} />
						</td>
					</tr>
				))}
			</tbody>
		</table>
	</div>
);

export default SparklineExample;
