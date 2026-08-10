import type { ChartState, Serie, TimeSerie } from "../../types";
import type { GlobalConfig } from "../globalConfig";
import {
	getFirstValorizedElementIndex,
	isDefined,
	isTimeSerie,
	normalizeBarRadius,
	trimZerosAndNullLinePath,
} from "../utils";
import {
	DEFAULT_HORIZONTAL_BAR_OFFSET,
	MIN_BAR_HEIGHT_FOR_LABEL,
	MIN_STACKED_BAR_HEIGHT_FOR_LABEL,
} from "./constants";
import {
	generateLine,
	generateVerticalBarPath,
	getValuePosition,
} from "./primitives";
import { createBandScale, getChartTimeScale, getChartYScale } from "./scales";
import {
	calculateStackedSeriesMax,
	getEffectiveMaxValue,
	getSerieMaxValueForAxis,
	getTimeSerieMaxValue,
	normalizeTime,
} from "./series";

// Funzione condivisa dalle 6 varianti di generate*DataPaths: inizializza le
// due Map (punti-etichetta interni e superiori) per una serie, stesso
// blocco ripetuto identico in tutte e 6 prima di questa estrazione (D3).
const initSerieAccumulators = (serieName: string) => {
	const dataPoints = new Map();
	dataPoints.set(serieName, []);

	const topLabelsPoints = new Map();
	topLabelsPoints.set(serieName, []);

	return { dataPoints, topLabelsPoints };
};

// Funzione che calcola i valori di partenza di una colonna stacked
const getStackedBarStartValue = (
	series: TimeSerie[],
	serieIndex: number,
	elementIndex: number,
) => {
	if (serieIndex <= 0) return 0;

	let startValue = 0;

	for (let i = serieIndex - 1; i > -1; i--) {
		const currentSerie = series[i].data;
		startValue += currentSerie?.[elementIndex]?.value;
	}

	return startValue;
};

// Funzione che genera i dataPaths per le barre stacked
export const generateStackedDataPaths = (
	serie: TimeSerie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
) => {
	if (!ctx.elements) return null;
	const { dataPoints, topLabelsPoints } = initSerieAccumulators(serie.name);

	const timeSerieData = serie.data;

	const barSeries = ctx.elements.filter(
		(el): el is TimeSerie => el.type === "bar-stacked",
	);

	const stackedMaxValue = calculateStackedSeriesMax(barSeries);

	const serieIndex = barSeries.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart,
		chartXEnd,
		chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	// Scala X (band): le barre stacked partono dal bordo sinistro (offset
	// padding/2), come nel caso non-stacked.
	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: padding / 2,
	});

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, stackedMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value,
			chartYEnd - padding,
		);

		const prevValue = getStackedBarStartValue(
			barSeries,
			serieIndex,
			serieElIndex,
		);
		const prevPosition =
			prevValue > 0
				? getValuePosition(flatMaxValue, prevValue, chartYEnd - padding)
				: 0;

		const serieY = chartYEnd - value - prevPosition;

		const barWidth = ctxBarWidth ?? padding;
		const serieElX = xScale.position(serieElIndex);

		const point =
			value < MIN_STACKED_BAR_HEIGHT_FOR_LABEL
				? [-1, -1]
				: [serieElX + barWidth / 2, serieY + value / 2 + padding / 4];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		const topLabelsPoint = [
			serieElX + barWidth / 2,
			serieY + value + padding / 4,
		];

		const allTopLabelsDataPoints = topLabelsPoints.get(serie.name);

		topLabelsPoints.set(serie.name, [
			...allTopLabelsDataPoints,
			topLabelsPoint,
		]);

		return generateVerticalBarPath(
			serieElX,
			serieY,
			barWidth,
			chartYEnd - prevPosition,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomRightRadius,
			bottomLeftRadius,
		);
	});

	return { paths, dataPoints, topLabelsPoints };
};

// Funzione che genera i dataPaths per grafici che ammettono valori negativi in base al tipo di serie da graficare
export const generateNegativeDataPaths = (
	serie: TimeSerie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		trimZeros?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
	type: "line" | "bar",
) => {
	if (!ctx.elements) return null;

	const { dataPoints, topLabelsPoints } = initSerieAccumulators(serie.name);

	// Converto gli zeri in null per ottenere delle spezzate in caso di ctx.trimZeros === true
	const timeSerieData = ctx.trimZeros
		? serie.data.map((el) => ({
				...el,
				value: el.value === 0 ? null : el.value,
			}))
		: serie.data;

	// Calcolo il valore massimo tra serie e soglie associate ad essa
	const serieMaxValue = getSerieMaxValueForAxis(ctx.elements, serie);

	const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart,
		chartXEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		globalConfig,
	} = ctx;

	// Spaziatura del punto linea verso il centro cella (la barra parte dal bordo).
	const xSpacing = globalConfig?.barWidth
		? Number(globalConfig?.barWidth) / 2
		: padding;

	// Scala X (band): barra da padding/2, punto linea +xSpacing (offset invariati).
	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: type === "bar" ? padding / 2 : padding / 2 + xSpacing,
	});

	// Calcolo il valore massimo della serie arrotondato al primo numero dell'ordine di grandezza utile. Ex. (20, 200, 2000)
	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	// Calcolo lo 0 per il grafico con valori negativi
	const zeroY = ctx.chartYMiddle ?? 0;

	// Spazio simmetrico (in px) disponibile sopra E sotto lo zero: e' lo
	// spazio minimo dei due (quello sopra, tra zeroY e il margine superiore
	// del canvas), cosi' che sia le barre/linee positive che quelle negative
	// restino sempre dentro il canvas. Stesso valore riusato in generateYAxis
	// (gridline) e in threshold.tsx, per coerenza tra tutti gli elementi.
	const halfHeight = zeroY - padding;

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const absValue = Math.abs(serieEl.value ?? 0);
		const isNegative =
			(serieEl.value ?? 0) < 0 ||
			(serieEl.value === 0 &&
				timeSerieData?.some((serieEl) => (serieEl.value ?? 0) < 0));
		const value = getValuePosition(flatMaxValue, absValue, halfHeight);

		const serieY = isDefined(serieEl.value)
			? isNegative
				? zeroY + value
				: zeroY - value
			: null;

		if (type === "bar") {
			const barWidth = ctxBarWidth ?? padding;
			const serieElX = xScale.position(serieElIndex);

			// Punto medio della barra tra zeroY (la base, non chartYEnd come nel
			// caso non-negativo) e serieY, con lo stesso nudge verso la base
			// gia' usato in topLabelPoint (segno che si inverte in base alla
			// direzione della barra).
			const point =
				value < MIN_BAR_HEIGHT_FOR_LABEL
					? [-1, -1]
					: [
							serieElX + barWidth / 2,
							isNegative
								? zeroY + value / 2 - padding / 4
								: zeroY - value / 2 + padding / 4,
						];

			const allDataPoints = dataPoints.get(serie.name);

			dataPoints.set(serie.name, [...allDataPoints, point]);

			const topLabelPoint = [
				serieElX + barWidth / 2,
				// chartYEnd - value - padding / 2,
				isNegative ? (serieY ?? 0) + padding / 2 : (serieY ?? 0) - padding / 2,
			];

			const allTopLabelsPoints = topLabelsPoints.get(serie.name);

			topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

			return generateVerticalBarPath(
				serieElX,
				serieY ?? 0,
				barWidth,
				zeroY,
				radius,
				topLeftRadius,
				topRightRadius,
				bottomRightRadius,
				bottomLeftRadius,
				isNegative,
			);
		}
		const serieElX = xScale.position(serieElIndex);

		const formattedX =
			isDefined(serieElX) && !Number.isNaN(serieElX) ? serieElX : null;
		const formattedY =
			isDefined(serieY) && !Number.isNaN(serieY) ? serieY : null;

		const point =
			isDefined(formattedX) && isDefined(formattedY)
				? [serieElX, formattedY]
				: [0, -10];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		if (!isDefined(formattedY)) {
			return "";
		}
		return serieElIndex === getFirstValorizedElementIndex(timeSerieData)
			? `M ${serieElX} ${formattedY}`
			: generateLine(serieElX, formattedY);
	});

	const normalizedPaths = trimZerosAndNullLinePath(paths);

	return { paths: normalizedPaths, dataPoints, topLabelsPoints };
};

// funzione che genera i dataPaths in base al tipo di serie da graficare
export const generateDataPaths = (
	serie: TimeSerie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		trimZeros?: boolean;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
	type: "line" | "bar",
) => {
	if (!ctx.elements) return null;

	const { dataPoints, topLabelsPoints } = initSerieAccumulators(serie.name);

	// Converto gli zeri in null per ottenere delle spezzate in caso di ctx.trimZeros === true
	const timeSerieData = ctx.trimZeros
		? serie.data.map((el) => ({
				...el,
				value: el.value === 0 ? null : el.value,
			}))
		: serie.data;

	// Calcolo il valore massimo tra serie e soglie associate ad essa
	const serieMaxValue = getSerieMaxValueForAxis(ctx.elements, serie);

	const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart,
		chartXEnd,
		chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		globalConfig,
	} = ctx;

	// Spaziatura aggiuntiva del punto linea (la barra parte dal bordo sinistro,
	// il punto linea e' spostato verso il centro cella).
	const xSpacing = globalConfig?.barWidth
		? Number(globalConfig?.barWidth) / 2
		: padding;

	// Scala X (band): incapsula `step * index + base` e il suo inverso. La barra
	// parte da padding/2, il punto linea aggiunge xSpacing (offset invariati).
	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: type === "bar" ? padding / 2 : padding / 2 + xSpacing,
	});

	// S2b: per le serie LINE su asse tempo il punto X e' proporzionale alla data
	// (getChartTimeScale, stessa fonte usata da asse e hover), non all'indice.
	// Le barre restano band. Se scaleType != "time" -> null -> comportamento
	// storico invariato.
	const timeScale =
		type === "line" && ctx.scaleType === "time" ? getChartTimeScale(ctx) : null;

	// Calcolo il valore massimo della serie arrotondato al primo numero dell'ordine di grandezza utile. Ex. (20, 200, 2000)
	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	// Scala Y dei valori (S1b). Dominio di default [0, flatMaxValue] -> byte-
	// identico al posizionamento storico. Con <YAxis min max> il dominio diventa
	// [yMin, yMax] (flatMax ignorato); i valori fuori sono clampati.
	const hasCustomYDomain = ctx.yMin !== undefined || ctx.yMax !== undefined;
	const yScale = getChartYScale({
		min: ctx.yMin,
		max: ctx.yMax ?? flatMaxValue,
		chartYEnd,
		padding,
	});

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const serieY = isDefined(serieEl.value)
			? yScale.scale(serieEl.value)
			: null;

		// `value` = altezza visiva (px). Col dominio di default resta
		// getValuePosition (byte-identico A2); col dominio custom deriva dalla
		// scala (baseline chartYEnd - top serieY), cosi' le label restano corrette.
		const value = hasCustomYDomain
			? serieY !== null
				? chartYEnd - serieY
				: 0
			: getValuePosition(flatMaxValue, serieEl.value ?? 0, chartYEnd - padding);

		if (type === "bar") {
			const barWidth = ctxBarWidth ?? padding;
			const serieElX = xScale.position(serieElIndex);

			const point =
				value < MIN_BAR_HEIGHT_FOR_LABEL
					? [-1, -1]
					: [serieElX + barWidth / 2, chartYEnd - value / 2 + padding / 4];

			const allDataPoints = dataPoints.get(serie.name);

			dataPoints.set(serie.name, [...allDataPoints, point]);

			const topLabelPoint = [
				serieElX + barWidth / 2,
				chartYEnd - value - padding / 2,
			];

			const allTopLabelsPoints = topLabelsPoints.get(serie.name);

			topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

			return generateVerticalBarPath(
				serieElX,
				serieY ?? 0,
				barWidth,
				chartYEnd,
				radius,
				topLeftRadius,
				topRightRadius,
				bottomRightRadius,
				bottomLeftRadius,
			);
		}
		const serieElX = timeScale
			? timeScale.position(normalizeTime(serieEl.date, ctx.parseDate))
			: xScale.position(serieElIndex);

		const formattedX =
			isDefined(serieElX) && !Number.isNaN(serieElX) ? serieElX : null;
		const formattedY =
			isDefined(serieY) && !Number.isNaN(serieY) ? serieY : null;

		const point =
			isDefined(formattedX) && isDefined(formattedY)
				? [serieElX, formattedY]
				: [0, -10];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		if (!isDefined(formattedY)) {
			return "";
		}
		return serieElIndex === getFirstValorizedElementIndex(timeSerieData)
			? `M ${serieElX} ${formattedY}`
			: generateLine(serieElX, formattedY);
	});

	const normalizedPaths = trimZerosAndNullLinePath(paths);

	return { paths: normalizedPaths, dataPoints, topLabelsPoints };
};

// Unica fonte di verita' per lo "slot" di ciascuna serie group-bar in una
// categoria: le serie con lo stesso stackedName condividono un solo slot
// (chiave = stackedName), le altre ne aprono uno proprio (chiave = name).
// Solo le serie type==="group-bar" contano: altri tipi nello stesso chart
// (Line, Bar, ...) non occupano uno slot (K10, prima generateGroupDataPaths
// e generateStackedGroupDataPaths avevano ciascuna una propria logica di
// indicizzazione leggermente diversa, causa di disallineamenti quando
// stacked e non-stacked erano mescolati nello stesso chart).
const getGroupBarSlotKeys = (elements: Serie[]) => {
	const groupBarSeries = elements.filter((el) => el.type === "group-bar");
	return groupBarSeries.reduce<string[]>((acc, el) => {
		const key = el.stackedName ?? el.name;
		if (!acc.includes(key)) acc.push(key);
		return acc;
	}, []);
};

// Quanti slot occupa un gruppo di barre per una categoria (K9, usato da
// axis.tsx per centrare la label di categoria sul gruppo invece che su una
// singola barra).
export const getGroupBarSlotCount = (elements: Serie[]) =>
	getGroupBarSlotKeys(elements).length;

// In quale slot cade una specifica serie group-bar, usato da
// generateGroupDataPaths e generateStackedGroupDataPaths per posizionarla
// orizzontalmente.
export const getGroupBarSlotIndex = (elements: Serie[], serie: TimeSerie) =>
	getGroupBarSlotKeys(elements).indexOf(serie.stackedName ?? serie.name);

// Offset orizzontale dal quale parte la prima categoria: la distanza tra
// chartXStart e il centro della prima barra/gruppo. Fonte di verita' UNICA per
// due usi che devono coincidere: la centratura delle label dell'asse X
// (axis.tsx) e l'aggancio dell'hover al mouse (svg.tsx). Per i GroupBar tiene
// conto della larghezza dell'intero gruppo (K9/K10), non di una singola barra.
export const getCategorySpacing = (
	elements: Serie[],
	globalConfig: GlobalConfig | undefined,
	padding: number,
): number => {
	const hasGroupBar = elements.some((el) => el.type === "group-bar");

	if (hasGroupBar) {
		const slotCount = getGroupBarSlotCount(elements);
		const barWidth = globalConfig?.barWidth
			? Number(globalConfig.barWidth)
			: padding;
		const barGroupGap = globalConfig?.barGroupGap
			? Number(globalConfig.barGroupGap)
			: padding / 4;
		const groupWidth =
			slotCount * barWidth + Math.max(0, slotCount - 1) * barGroupGap;
		return padding / 2 + groupWidth / 2;
	}

	return globalConfig?.barWidth
		? (Number(globalConfig.barWidth) + padding) / 2
		: padding;
};

// Funzione che genera i dataPaths per le barre raggruppate

export const generateGroupDataPaths = (
	serie: TimeSerie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		barGroupGap?: number;
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
) => {
	if (!ctx.elements) return null;
	const { dataPoints, topLabelsPoints } = initSerieAccumulators(serie.name);

	const timeSerieData = serie.data;

	const barSeries = ctx.elements.filter(
		(el): el is TimeSerie => el.type === "group-bar",
	);

	const flatSeries = [...barSeries.map((serie) => serie.data)].flat();

	const serieMaxValue = getTimeSerieMaxValue(flatSeries);

	const serieIndex = getGroupBarSlotIndex(ctx.elements, serie);

	if (serieIndex < 0) return null;

	const {
		chartXStart,
		chartXEnd,
		chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		barGroupGap: ctxBarGroupGap,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	// Scala X (band) della categoria: firstOffset padding/2 come le altre barre.
	// L'offset di slot dentro il gruppo resta additivo (K8/K10).
	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: padding / 2,
	});

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartYEnd - padding,
		);

		const serieY = isDefined(serieEl.value) ? chartYEnd - value : null;

		const barWidth = ctxBarWidth ?? padding;
		// Incremento diretto barWidth+gap: le barre dello stesso gruppo restano
		// vicine indipendentemente dallo spazio della categoria (K8). Base
		// allineata alle altre generate*DataPaths tramite la band scale (K10).
		const barGap = ctxBarGroupGap ?? padding / 4;
		const serieElX =
			xScale.position(serieElIndex) + (barWidth + barGap) * serieIndex;

		const point =
			value < MIN_BAR_HEIGHT_FOR_LABEL
				? [-1, -1]
				: [serieElX + barWidth / 2, chartYEnd - value / 2 + padding / 4];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		const topLabelPoint = [
			serieElX + barWidth / 2,
			chartYEnd - value - padding / 2,
		];

		const allTopLabelsPoints = topLabelsPoints.get(serie.name);

		topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

		return generateVerticalBarPath(
			serieElX,
			serieY ?? 0,
			barWidth,
			chartYEnd,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomRightRadius,
			bottomLeftRadius,
		);
	});

	return { paths, dataPoints, topLabelsPoints };
};

// Funzione che genera i dataPaths per le barre raggruppate stacked
export const generateStackedGroupDataPaths = (
	serie: TimeSerie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		barGroupGap?: number;
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
	},
) => {
	if (!ctx.elements) return null;
	const { dataPoints, topLabelsPoints } = initSerieAccumulators(serie.name);

	const timeSerieData = serie.data;

	// Prendo le altre serie che vanno impilate con quella corrente
	const stackedSeries = ctx.elements.filter(
		(el): el is TimeSerie =>
			isTimeSerie(el) && el.stackedName === serie.stackedName,
	);

	// Listo tutte le serie non stacked
	const nonStackedSeries = ctx.elements.filter(
		(el): el is TimeSerie => el.type === "group-bar" && !el.stackedName,
	);

	// Listo tutte le serie stacked
	const allStackedSeries = ctx.elements.filter(
		(el): el is TimeSerie => el.type === "group-bar" && !!el.stackedName,
	);

	// Prendo tutti gli stackedName delle serie
	const allStackedNames = allStackedSeries.map((el) => el.stackedName);

	// Filtro tutti i nomi per avere una sola occorrenza
	const uniqueStackedNames = Array.from(new Set(allStackedNames));

	const stackedSeriesMaxArray = uniqueStackedNames.map((name) => {
		const involvedSeries = allStackedSeries.filter(
			(serie) => serie.stackedName === name,
		);

		const maxValue = calculateStackedSeriesMax(involvedSeries);
		return maxValue;
	});

	const nonStackedSeriesMaxArray = nonStackedSeries.map((serie) =>
		getTimeSerieMaxValue(serie.data),
	);

	const stackedMaxValue = Math.max(
		...stackedSeriesMaxArray,
		...nonStackedSeriesMaxArray,
	);

	const serieStackedIndex = stackedSeries.findIndex(
		(el) => el.name === serie.name,
	);

	const serieGroupIndex = getGroupBarSlotIndex(ctx.elements, serie);

	if (serieGroupIndex < 0) return null;

	const {
		chartXStart,
		chartXEnd,
		chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		barGroupGap: ctxBarGroupGap,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	// Scala X (band) della categoria: firstOffset padding/2, slot additivo.
	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: padding / 2,
	});

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, stackedMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value,
			chartYEnd - padding,
		);

		const prevValue = getStackedBarStartValue(
			stackedSeries,
			serieStackedIndex,
			serieElIndex,
		);
		const prevPosition =
			prevValue > 0
				? getValuePosition(flatMaxValue, prevValue, chartYEnd - padding)
				: 0;

		const serieY = chartYEnd - value - prevPosition;

		const barWidth = ctxBarWidth ?? padding;

		// Incremento diretto barWidth+gap: barre dello stesso gruppo vicine
		// indipendentemente dallo spazio della categoria (K8).
		const barGap = ctxBarGroupGap ?? padding / 4;
		const serieElX =
			xScale.position(serieElIndex) + (barWidth + barGap) * serieGroupIndex;

		const point =
			value < MIN_STACKED_BAR_HEIGHT_FOR_LABEL
				? [-1, -1]
				: [serieElX + barWidth / 2, serieY + value / 2 + padding / 4];

		const allDataPoints = dataPoints.get(serie.name);

		dataPoints.set(serie.name, [...allDataPoints, point]);

		const topLabelsPoint = [
			serieElX + barWidth / 2,
			serieY + value + padding / 4,
		];

		const allTopLabelsDataPoints = topLabelsPoints.get(serie.name);

		topLabelsPoints.set(serie.name, [
			...allTopLabelsDataPoints,
			topLabelsPoint,
		]);

		return generateVerticalBarPath(
			serieElX,
			serieY,
			barWidth,
			chartYEnd - prevPosition,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomRightRadius,
			bottomLeftRadius,
		);
	});

	return { paths, dataPoints, topLabelsPoints };
};

// Funzione che genera il path SVG per una barra orizzontale
export const generateHorizontalBarPath = (
	y: number,
	x: number,
	barHeight: number,
	startX: number,
	radius?: number,
	topLeftRadius?: number,
	topRightRadius?: number,
	bottomRightRadius?: number,
	bottomLeftRadius?: number,
) => {
	if (
		(radius ||
			topLeftRadius ||
			bottomLeftRadius ||
			topRightRadius ||
			bottomRightRadius) &&
		x !== startX
	) {
		const normalizedRadius = normalizeBarRadius(radius, x - startX);
		const normalizedTopLeftRadius = normalizeBarRadius(
			topLeftRadius,
			x - startX,
		);
		const normalizedBottomLeftRadius = normalizeBarRadius(
			bottomLeftRadius,
			x - startX,
		);
		const normalizedTopRightRadius = normalizeBarRadius(
			topRightRadius,
			x - startX,
		);
		const normalizedBottomRightRadius = normalizeBarRadius(
			bottomRightRadius,
			x - startX,
		);

		const leftX = startX;
		const rightX = x;

		const topY = y;
		const bottomY = y + barHeight;

		const topLeftCorner =
			normalizedRadius || normalizedTopLeftRadius
				? `Q${leftX},${topY} ${leftX},${topY + (normalizedRadius || normalizedTopLeftRadius || 0)}`
				: "";
		const topRightCorner =
			normalizedRadius || normalizedTopRightRadius
				? `Q${rightX},${topY} ${rightX - (normalizedRadius || normalizedTopRightRadius || 0)},${topY}`
				: "";
		const bottomRightCorner =
			normalizedRadius || normalizedBottomRightRadius
				? `Q${rightX},${bottomY} ${rightX},${bottomY - (normalizedRadius || normalizedBottomRightRadius || 0)}`
				: "";
		const bottomLeftCorner =
			normalizedRadius || normalizedBottomLeftRadius
				? `Q${leftX},${bottomY} ${leftX + (normalizedRadius || normalizedBottomLeftRadius || 0)},${bottomY}`
				: "";

		const startPosition = `M ${leftX + (normalizedRadius || normalizedTopLeftRadius || 0)} ${topY}`;
		const topLeftPoint = `H ${rightX - (normalizedRadius || normalizedTopRightRadius || 0)}`;
		const topRightPoint = `V ${bottomY - (normalizedRadius || normalizedTopRightRadius || 0)}`;
		const bottomRightPoint = `H ${leftX + (normalizedRadius || normalizedBottomLeftRadius || 0)}`;
		const bottomLeftPoint = `V ${topY + (normalizedRadius || normalizedTopLeftRadius || 0)}`;

		return `${startPosition} ${topLeftPoint} ${topRightCorner} ${topRightPoint} ${bottomRightCorner} ${bottomRightPoint} ${bottomLeftCorner} ${bottomLeftPoint} ${topLeftCorner}`;
	}
	return `M ${startX} ${y} H ${x} V ${y + barHeight} H ${startX} Z`;
};

// Funzione che genera i dataPaths per barre orizzontali
export const generateHorizontalDataPaths = (
	serie: TimeSerie,
	ctx: ChartState & {
		padding: number;
		barWidth?: number;
		radius?: number;
		trimZeros?: boolean;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
		barOffset?: number;
	},
	type: "line" | "bar",
) => {
	if (!ctx.elements) return null;

	const { dataPoints, topLabelsPoints } = initSerieAccumulators(serie.name);

	const timeSerieData = ctx.trimZeros
		? serie.data.map((el) => ({
				...el,
				value: el.value === 0 ? null : el.value,
			}))
		: serie.data;

	const serieMaxValue = getSerieMaxValueForAxis(ctx.elements, serie);

	const serieIndex = ctx.elements.findIndex((el) => el.name === serie.name);
	if (serieIndex < 0) return null;

	const {
		chartXStart: rawChartXStart,
		chartXEnd: rawChartXEnd,
		chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		barOffset,
	} = ctx;

	// barOffset ora è parametrico
	const effectiveBarOffset =
		typeof barOffset === "number" ? barOffset : DEFAULT_HORIZONTAL_BAR_OFFSET;
	const chartXStart = rawChartXStart + effectiveBarOffset;
	const chartXEnd = rawChartXEnd - 8;

	// Scala band applicata alla dimensione Y (grafico orizzontale: le categorie
	// scorrono in verticale). Stessa astrazione dell'asse X, orientamento
	// diverso; offset di partenza padding/2 invariato.
	const yScale = createBandScale({
		start: 0,
		end: chartYEnd - padding,
		count: timeSerieData?.length ?? 0,
		firstOffset: padding / 2,
	});

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartXEnd - chartXStart - padding,
		);
		const serieX = isDefined(serieEl.value) ? chartXStart + value : null;
		const barHeight = ctxBarWidth ?? padding;
		const serieElY = yScale.position(serieElIndex);

		if (type === "bar") {
			const point =
				value < MIN_BAR_HEIGHT_FOR_LABEL
					? [-1, -1]
					: [chartXStart + value / 2, serieElY + barHeight / 2];

			const allDataPoints = dataPoints.get(serie.name);
			dataPoints.set(serie.name, [...allDataPoints, point]);

			const topLabelPoint = [
				chartXStart + value + padding / 2,
				serieElY + barHeight / 2,
			];
			const allTopLabelsPoints = topLabelsPoints.get(serie.name);
			topLabelsPoints.set(serie.name, [...allTopLabelsPoints, topLabelPoint]);

			return generateHorizontalBarPath(
				serieElY,
				chartXStart + value,
				barHeight,
				chartXStart,
				radius,
				topLeftRadius,
				topRightRadius,
				bottomRightRadius,
				bottomLeftRadius,
			);
		}

		// Caso LINEA ORIZZONTALE
		const formattedX =
			isDefined(serieX) && !Number.isNaN(serieX) ? serieX : null;
		const formattedY =
			isDefined(serieElY) && !Number.isNaN(serieElY) ? serieElY : null;

		const point =
			isDefined(formattedX) && isDefined(formattedY)
				? [formattedX, serieElY]
				: [0, -10];

		const allDataPoints = dataPoints.get(serie.name);
		dataPoints.set(serie.name, [...allDataPoints, point]);

		if (!isDefined(formattedX)) {
			return "";
		}
		return serieElIndex === getFirstValorizedElementIndex(timeSerieData)
			? `M ${formattedX} ${serieElY}`
			: generateLine(formattedX, serieElY);
	});

	const normalizedPaths = trimZerosAndNullLinePath(paths);

	return { paths: normalizedPaths, dataPoints, topLabelsPoints };
};
