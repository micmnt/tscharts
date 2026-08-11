/* Context Imports */
import { useCanvasLayer } from "../contexts/canvasContext";
import {
	useChartsInteractive,
	useChartsStructural,
	useChartsTheme,
} from "../contexts/chartContext";
/* Core Imports */
import {
	createBandScale,
	DEFAULT_HORIZONTAL_BAR_OFFSET,
	getCategorySpacing,
	getChartTimeScale,
	getChartYScale,
	getEffectiveMaxValue,
	getValuePosition,
} from "../lib/core";
import defaultTheme from "../lib/defaultTheme";
import { isTimeSerie } from "../lib/utils";
import type { TimeSerie } from "../types";

// Il "frame" del grafico risolto: sistema di coordinate + dimensioni + serie
// (opzionale) + stato di hover. E' cio' che serve a una marca CUSTOM per
// disegnarsi come le built-in, senza accedere agli interni della libreria.
export type ChartMark = {
	// px X del punto: indice categoria (scaleType "band") o timestamp ms
	// (scaleType "time"). Allineato ai marchi della serie riferita: punto della
	// linea (dot) o centro della barra.
	x: (indexOrTime: number) => number;
	// px Y di un valore (zoom-aware; sign-aware sui grafici negativi) e inverso.
	// Convenzione VERTICALE: su grafici horizontal usa `point`.
	y: (value: number) => number;
	yInvert: (px: number) => number;
	// Punto {x,y} sullo SCHERMO per la categoria `index` al valore `value`,
	// consapevole di orientamento (vertical/horizontal) e segno (negativi). E'
	// l'accessor generale; `x`/`y` sono la decomposizione del caso verticale.
	point: (index: number, value: number) => { x: number; y: number };
	dimensions: {
		chartXStart: number;
		chartXEnd: number;
		chartYEnd: number;
		chartYMiddle: number;
		width: number;
		height: number;
		padding: number;
	};
	// La serie di `elements` col nome dato (se passato e di tipo temporale):
	// permette di ereditare dominio/tooltip/hover/legenda gia' funzionanti.
	serie?: TimeSerie;
	// Colore risolto della serie (serie.color -> palette del tema).
	color?: string;
	// Indice della categoria in hover (o null).
	hoveredIndex: number | null;
	scaleType: "band" | "time";
	horizontal: boolean;
	// true se il grafico e' in renderer="canvas": disegna via useCanvasMark
	// (draw-op sul canvas) invece di rendere SVG.
	isCanvas: boolean;
};

// Hook PUBBLICO per marche custom: componi un componente figlio di <Chart> che
// legge questo frame e disegna SVG arbitrario (o via canvas se isCanvas), o usa
// i propri dati posizionati con `point`. Ritorna null finche' non e' misurato.
//
// Orientamento/segno: `point(index, value)` gestisce vertical/horizontal e i
// domini negativi. `x`/`y` sono la decomposizione del caso verticale (y e'
// comunque sign-aware). Orizzontale: allineato alle barre con `barOffset` di
// default (offset custom per-marca non riflessi).
export function useChartMark(name?: string): ChartMark | null {
	const ctx = useChartsStructural();
	const theme = useChartsTheme();
	const interactive = useChartsInteractive();
	const canvasLayer = useCanvasLayer();

	if (!ctx) return null;

	const {
		chartXStart = 0,
		chartXEnd = 0,
		chartYEnd = 0,
		chartYMiddle = 0,
		width = 0,
		height = 0,
		elements,
		globalConfig,
		scaleType,
		timeDomain,
	} = ctx;

	const padding = theme?.padding ?? defaultTheme.padding;

	// Non pronto: dimensioni non ancora misurate (come le marche built-in).
	if (!width || !height || chartYEnd <= 0) return null;

	// Scala dei valori Y: stessi estremi EFFETTIVI usati dai generatori
	// (ctx.yMin/yMax sono gia' zoom-aware; se assenti, dominio auto [0, max]).
	const yMax =
		ctx.yMax ?? getEffectiveMaxValue(ctx.flatMax, ctx.timeSeriesMaxValue ?? 0);
	const yMin = ctx.yMin ?? 0;
	const yScale = getChartYScale({ min: yMin, max: yMax, chartYEnd, padding });

	// Serie + colore (se `name` dato e serie temporale).
	const found = name ? elements?.find((el) => el.name === name) : undefined;
	const serie = found && isTimeSerie(found) ? found : undefined;
	const serieIndex =
		name && elements ? elements.findIndex((el) => el.name === name) : -1;
	const color =
		serie?.color ??
		theme?.seriesColors?.[serieIndex >= 0 ? serieIndex : 0] ??
		theme?.seriesColors?.[0];

	// Mapping X: scala tempo (posizione proporzionale al timestamp) o band
	// (centro categoria). Il numero di categorie viene dalla serie indicata o
	// dalla serie temporale piu' lunga in `elements`.
	const timeScale =
		scaleType === "time"
			? getChartTimeScale({ timeDomain, chartXStart, chartXEnd, padding })
			: null;
	const timeSerieLengths = (elements ?? [])
		.filter(isTimeSerie)
		.map((s) => s.data.length);
	const categoryCount =
		serie?.data.length ??
		(timeSerieLengths.length ? Math.max(...timeSerieLengths) : 1);
	// Offset X allineato ai marchi della serie RIFERITA: il punto di una linea sta
	// a padding/2 + xSpacing (spostato verso il centro cella), il centro di una
	// barra a getCategorySpacing. Senza serie (dati propri) si usa l'offset linea.
	const isBarLike =
		serie?.type === "bar" ||
		serie?.type === "bar-stacked" ||
		serie?.type === "group-bar";
	const xSpacing = globalConfig?.barWidth
		? Number(globalConfig.barWidth) / 2
		: padding;
	const bandScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: categoryCount,
		firstOffset: isBarLike
			? getCategorySpacing(elements ?? [], globalConfig, padding)
			: padding / 2 + xSpacing,
	});

	const xCategory = (indexOrTime: number) =>
		timeScale
			? timeScale.position(indexOrTime)
			: bandScale.position(indexOrTime);

	// Y sign-aware: sui grafici negativi il dominio e' simmetrico attorno alla
	// linea dello zero (chartYMiddle), come generateNegativeDataPaths:
	// serieY = chartYMiddle - halfHeight * value / flatMaxAbs.
	const flatMaxAbs =
		getEffectiveMaxValue(ctx.flatMax, ctx.timeSeriesMaxValue ?? 0) || 1;
	const zeroY = chartYMiddle;
	const halfHeight = zeroY - padding || 1;
	const yValue = ctx.negative
		? (value: number) => zeroY - (halfHeight * value) / flatMaxAbs
		: (value: number) => yScale.scale(value);
	const yValueInvert = ctx.negative
		? (px: number) => ((zeroY - px) * flatMaxAbs) / halfHeight
		: (px: number) => yScale.invert(px);

	// Orizzontale (best-effort): valore -> X (dalla baseline sinistra), categoria
	// -> Y (band verticale). Gli offset (barOffset, -8) sono quelli di default del
	// generatore orizzontale: allineato alle barre con offset di default.
	const hOffset =
		typeof globalConfig?.barOffset === "number"
			? globalConfig.barOffset
			: DEFAULT_HORIZONTAL_BAR_OFFSET;
	const hStart = chartXStart + hOffset;
	const hEnd = chartXEnd - 8;
	// Offset Y (categoria) serie-aware come per la X verticale: il dot della linea
	// sta a padding/2, il centro della barra a padding/2 + barHeight/2.
	const barHeight = globalConfig?.barWidth
		? Number(globalConfig.barWidth)
		: padding;
	const yBand = createBandScale({
		start: 0,
		end: chartYEnd - padding,
		count: categoryCount,
		firstOffset: isBarLike ? padding / 2 + barHeight / 2 : padding / 2,
	});

	const point = (index: number, value: number) =>
		ctx.horizontal
			? {
					x:
						hStart +
						getValuePosition(flatMaxAbs, value, hEnd - hStart - padding),
					y: yBand.position(index),
				}
			: { x: xCategory(index), y: yValue(value) };

	return {
		x: xCategory,
		y: yValue,
		yInvert: yValueInvert,
		point,
		dimensions: {
			chartXStart,
			chartXEnd,
			chartYEnd,
			chartYMiddle,
			width,
			height,
			padding,
		},
		serie,
		color,
		hoveredIndex: interactive?.hoveredElement?.elementIndex ?? null,
		scaleType: timeScale ? "time" : "band",
		horizontal: !!ctx.horizontal,
		isCanvas: !!canvasLayer,
	};
}
