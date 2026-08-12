import XAxis from "../components/axis/xAxis";
import YAxis from "../components/axis/yAxis";
import Chart from "../components/chart/chart";
import Legend from "../components/legend/legend";
import Line, { type LineDotProps } from "../components/line/line";
import Tooltip from "../components/tooltip/tooltip";
import { useCanvasMark } from "../hooks/useCanvasMark";
import { useChartMark } from "../hooks/useChartMark";

const diamond = (x: number, y: number, r: number) =>
	`M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;

const diamondDot = ({ x, y, hovered, color }: LineDotProps) => (
	<path
		d={diamond(x, y, hovered ? 8 : 6)}
		fill={hovered ? color : "#fff"}
		stroke={color}
		strokeWidth={2}
	/>
);

const CanvasDiamonds = ({ name }: { name: string }) => {
	const mark = useChartMark(name);
	const serie = mark?.serie;
	const xInput = (i: number) =>
		mark?.scaleType === "time" ? Number(serie?.data[i].date) : i;
	useCanvasMark(
		mark?.isCanvas && serie
			? (g) => {
					g.fillStyle = mark.color ?? "#000";
					for (let i = 0; i < serie.data.length; i++) {
						const { x, y } = mark.point(xInput(i), serie.data[i].value);
						g.beginPath();
						g.moveTo(x, y - 4);
						g.lineTo(x + 4, y);
						g.lineTo(x, y + 4);
						g.lineTo(x - 4, y);
						g.closePath();
						g.fill();
					}
				}
			: null,
	);
	if (!mark || !serie || mark.isCanvas) return null;
	return (
		<>
			{serie.data.map((d, i) => {
				const p = mark.point(xInput(i), d.value);
				return <path key={d.date} d={diamond(p.x, p.y, 4)} fill={mark.color} />;
			})}
		</>
	);
};

type Candle = { open: number; high: number; low: number; close: number };

const Candlesticks = ({ name, ohlc }: { name: string; ohlc: Candle[] }) => {
	const mark = useChartMark(name);
	if (!mark) return null;
	const half = 6;
	return (
		<>
			{ohlc.map((c, i) => {
				const cx = mark.x(i);
				const up = c.close >= c.open;
				const color = up ? "#16a34a" : "#dc2626";
				const yOpen = mark.y(c.open);
				const yClose = mark.y(c.close);
				const top = Math.min(yOpen, yClose);
				const bodyH = Math.max(1, Math.abs(yOpen - yClose));
				return (
					<g key={`candle-${i}-${c.open}-${c.close}`}>
						<line
							x1={cx}
							x2={cx}
							y1={mark.y(c.high)}
							y2={mark.y(c.low)}
							stroke={color}
							strokeWidth={1.5}
						/>
						<rect
							x={cx - half}
							y={top}
							width={half * 2}
							height={bodyH}
							fill={color}
						/>
					</g>
				);
			})}
		</>
	);
};

const points = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const serieData = points.map((d, i) => ({
	date: d,
	value: [40, 62, 55, 74, 60, 82, 70][i],
}));

const closes = [40, 62, 55, 74, 60, 82, 70];
const ohlc: Candle[] = closes.map((close, i) => {
	const open = i === 0 ? 38 : closes[i - 1];
	const high = Math.max(open, close) + 6;
	const low = Math.min(open, close) - 6;
	return { open, high, low, close };
});

const scatter = (() => {
	const out: { date: string; value: number }[] = [];
	let v = 50;
	for (let i = 0; i < 500; i++) {
		v += (Math.random() - 0.5) * 8;
		v = Math.max(4, Math.min(96, v));
		out.push({ date: String(i), value: Number(v.toFixed(1)) });
	}
	return out;
})();

const negData = [
	{ date: "Gen", value: 30 },
	{ date: "Feb", value: -20 },
	{ date: "Mar", value: 42 },
	{ date: "Apr", value: -15 },
	{ date: "Mag", value: 25 },
	{ date: "Giu", value: -35 },
];

const hData = [
	{ date: "A", value: 40 },
	{ date: "B", value: 72 },
	{ date: "C", value: 55 },
	{ date: "D", value: 88 },
	{ date: "E", value: 63 },
];

export const CustomMarksExample = ({
	variant,
}: {
	variant: "diamonds" | "candlestick" | "canvas" | "negative" | "horizontal";
}) => {
	if (variant === "canvas") {
		return (
			<Chart
				width={720}
				height={340}
				renderer="canvas"
				elements={[{ name: "segnale", type: "line", uom: "", data: scatter }]}
			>
				<YAxis name="segnale" showName showLine />
				<Line name="segnale" hideLine />
				<CanvasDiamonds name="segnale" />
				<XAxis
					scaleType="time"
					parseDate={Number}
					ticks={8}
					tickFormat={(t) => `#${Math.round(t)}`}
					showLine
				/>
				<Legend />
				<Tooltip />
			</Chart>
		);
	}

	if (variant === "negative") {
		return (
			<Chart
				width={640}
				height={340}
				elements={[{ name: "delta", type: "line", uom: "", data: negData }]}
			>
				<YAxis name="delta" showName showLine />
				<Line name="delta" showDots renderDot={diamondDot} />
				<XAxis dataPoints={negData.map((d) => d.date)} showLine />
				<Legend />
				<Tooltip />
			</Chart>
		);
	}

	if (variant === "horizontal") {
		return (
			<Chart
				width={640}
				height={340}
				elements={[{ name: "punteggio", type: "line", uom: "", data: hData }]}
			>
				<YAxis name="punteggio" showName showLine />
				<Line name="punteggio" horizontal showDots renderDot={diamondDot} />
				<XAxis dataPoints={hData.map((d) => d.date)} showLine />
				<Legend />
				<Tooltip />
			</Chart>
		);
	}

	if (variant === "diamonds") {
		return (
			<Chart
				width={640}
				height={340}
				elements={[
					{ name: "vendite", type: "line", uom: "€", data: serieData },
				]}
			>
				<YAxis name="vendite" showName showLine />
				<Line name="vendite" showDots renderDot={diamondDot} />
				<XAxis dataPoints={points} showLine />
				<Legend />
				<Tooltip />
			</Chart>
		);
	}

	return (
		<Chart
			width={640}
			height={340}
			elements={[{ name: "prezzo", type: "line", uom: "€", data: serieData }]}
		>
			<YAxis name="prezzo" min={20} max={95} showName showLine />
			<Line name="prezzo" hideLine />
			<Candlesticks name="prezzo" ohlc={ohlc} />
			<XAxis dataPoints={points} showLine />
			<Legend />
			<Tooltip />
		</Chart>
	);
};
