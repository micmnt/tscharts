import type { FC } from "react";
import type { Serie } from "../../../types";
import XAxis from "../../axis/xAxis";
import YAxis from "../../axis/yAxis";
import Chart from "../../chart/chart";
import Legend from "../../legend/legend";
import Line from "../../line/line";
import Tooltip, { type TooltipRenderProps } from "../tooltip";

const dataPoints = ["gen", "feb", "mar", "apr", "mag", "giu"];

const euro = (value: number) =>
	`${value.toLocaleString("it-IT", { minimumFractionDigits: 0 })} €`;

const elements: Serie[] = [
	{
		name: "ricavi",
		type: "line",
		uom: "€",
		axisName: "conto",
		format: euro,
		data: [12400, 13100, 11800, 14200, 15100, 16600].map((value, index) => ({
			date: dataPoints[index],
			value,
		})),
	},
	{
		name: "costi",
		type: "line",
		uom: "€",
		axisName: "conto",
		format: euro,
		data: [9800, 10400, 9100, 11200, 12300, 10900].map((value, index) => ({
			date: dataPoints[index],
			value,
		})),
	},
];

const CardTooltip = ({ label, series }: TooltipRenderProps) => {
	const [ricavi, costi] = series.map((row) => row.value ?? 0);
	const margine = ricavi - costi;

	return (
		<div
			style={{
				background: "white",
				border: "1px solid #e3e3e3",
				borderRadius: 10,
				boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
				padding: "10px 14px",
				fontSize: 12,
				color: "#1f2933",
				minWidth: 180,
			}}
		>
			<div
				style={{
					fontWeight: 700,
					textTransform: "uppercase",
					letterSpacing: 0.6,
					color: "#7b8794",
					marginBottom: 8,
				}}
			>
				{label}
			</div>

			{series.map((row) => (
				<div
					key={row.name}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 16,
						padding: "2px 0",
					}}
				>
					<span style={{ display: "flex", alignItems: "center", gap: 6 }}>
						<span
							style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								background: row.color,
							}}
						/>
						{row.name}
					</span>
					<strong style={{ fontVariantNumeric: "tabular-nums" }}>
						{row.formatted}
					</strong>
				</div>
			))}

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: 16,
					marginTop: 8,
					paddingTop: 8,
					borderTop: "1px solid #e3e3e3",
					color: margine >= 0 ? "#1b7f4f" : "#c0392b",
				}}
			>
				<span>margine</span>
				<strong style={{ fontVariantNumeric: "tabular-nums" }}>
					{euro(margine)}
				</strong>
			</div>
		</div>
	);
};

const CustomRenderExample: FC = () => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100%",
				padding: 24,
			}}
		>
			<Chart width={520} height={380} elements={elements}>
				<YAxis name="conto" showLine showName />
				<Line name="ricavi" showDots />
				<Line name="costi" showDots />
				<XAxis dataPoints={dataPoints} showLine showName name="mese" />
				<Tooltip showGrid render={(props) => <CardTooltip {...props} />} />
				<Legend height={60} showDots />
			</Chart>
		</div>
	);
};

export default CustomRenderExample;
