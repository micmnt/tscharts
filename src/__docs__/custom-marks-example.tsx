import XAxis from "../components/axis/xAxis";
import YAxis from "../components/axis/yAxis";
import Chart from "../components/chart/chart";
import Legend from "../components/legend/legend";
import Line, { type LineDotProps } from "../components/line/line";
import Tooltip from "../components/tooltip/tooltip";
import { useCanvasMark } from "../hooks/useCanvasMark";
import { useChartMark } from "../hooks/useChartMark";

// Rombo centrato in (x,y).
const diamond = (x: number, y: number, r: number) =>
	`M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;

// renderDot condiviso: rombo AL POSTO del pallino, alla posizione esatta del
// punto; in hover si riempie e cresce. Sostituisce il dot della linea (niente
// tondo dietro), gestito da <Line>.
const diamondDot = ({ x, y, hovered, color }: LineDotProps) => (
	<path
		d={diamond(x, y, hovered ? 8 : 6)}
		fill={hovered ? color : "#fff"}
		stroke={color}
		strokeWidth={2}
	/>
);

// ---- Marca custom CANVAS-accelerata: gli stessi rombi, ma disegnati su UN
// canvas (draw-op) quando renderer="canvas", con fallback SVG. Regge migliaia di
// punti. `useCanvasMark` e' no-op in SVG; `mark.isCanvas` decide il ramo. ----
const CanvasDiamonds = ({ name }: { name: string }) => {
	const mark = useChartMark(name);
	const serie = mark?.serie;
	// Su scala tempo l'input di x/point e' il timestamp (qui = Number(date)).
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
	// canvas: gia' disegnato sul bitmap; SVG: fallback (renderer="svg").
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

// ---- Candlestick con DATI PROPRI (open/high/low/close). Usa solo il sistema di
// coordinate; la serie "prezzo" in `elements` fornisce categorie e dominio. ----
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
						{/* wick: minimo -> massimo */}
						<line
							x1={cx}
							x2={cx}
							y1={mark.y(c.high)}
							y2={mark.y(c.low)}
							stroke={color}
							strokeWidth={1.5}
						/>
						{/* corpo: open -> close */}
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

// Scatter denso (date numeriche): X su scala tempo con pochi tick, cosi' l'asse
// resta leggibile anche con tanti punti.
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

// Esempi di marche CUSTOM composte in <Chart> tramite useChartMark.
export const CustomMarksExample = ({
	variant,
}: {
	variant: "diamonds" | "candlestick" | "canvas" | "negative" | "horizontal";
}) => {
	if (variant === "canvas") {
		// ~500 punti: la marca custom (rombi) e' disegnata sul canvas via draw-op.
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
		// Linea NEGATIVA con rombi al posto dei pallini (renderDot): sostituiscono
		// il dot, quindi in hover NON appare il cerchio. La linea resta.
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
		// Linea ORIZZONTALE con rombi al posto dei pallini (renderDot): la linea
		// resta e in hover non c'e' il cerchio.
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
				{/* renderDot: la marca custom sostituisce il dot ALLA POSIZIONE
				    ESATTA del punto; l'hover riempie il rombo (niente cerchio). */}
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
			{/* la linea non serve: la teniamo nascosta, guida solo il dominio */}
			<Line name="prezzo" hideLine />
			<Candlesticks name="prezzo" ohlc={ohlc} />
			<XAxis dataPoints={points} showLine />
			<Legend />
			<Tooltip />
		</Chart>
	);
};
