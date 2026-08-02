import type { ChartState, Serie, TimeSerie } from "../../types";
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
import {
	calculateStackedSeriesMax,
	getEffectiveMaxValue,
	getSerieMaxValueForAxis,
	getTimeSerieMaxValue,
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
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	const chartXEnd = _chartXEnd as number;
	const chartXStart = _chartXStart as number;
	const chartYEnd = _chartYEnd as number;

	const xAxisInterval =
		(chartXEnd - chartXStart) / (timeSerieData?.length || 1);

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
		const serieElX = xAxisInterval * serieElIndex + (chartXStart + padding / 2);

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
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		globalConfig,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;

	// Calcolo l'intervallo tra un punto/barra e l'altro sull'asse X
	const xAxisInterval = (chartXEnd - chartXStart) / timeSerieData?.length || 1;

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
			const serieElX =
				xAxisInterval * serieElIndex + (chartXStart + padding / 2);

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
		const xSpacing = globalConfig?.barWidth
			? Number(globalConfig?.barWidth) / 2
			: padding;

		const serieElX =
			xAxisInterval * serieElIndex + xSpacing + (chartXStart + padding / 2);

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
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		globalConfig,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	// Calcolo l'intervallo tra un punto/barra e l'altro sull'asse X
	const xAxisInterval = (chartXEnd - chartXStart) / timeSerieData?.length || 1;

	// Calcolo il valore massimo della serie arrotondato al primo numero dell'ordine di grandezza utile. Ex. (20, 200, 2000)
	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartYEnd - padding,
		);

		const serieY = isDefined(serieEl.value) ? chartYEnd - value : null;

		if (type === "bar") {
			const barWidth = ctxBarWidth ?? padding;
			const serieElX =
				xAxisInterval * serieElIndex + (chartXStart + padding / 2);

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
		const xSpacing = globalConfig?.barWidth
			? Number(globalConfig?.barWidth) / 2
			: padding;

		const serieElX =
			xAxisInterval * serieElIndex + xSpacing + (chartXStart + padding / 2);

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

// Funzione che genera i dataPaths per le barre raggruppate
// Quanti "slot" occupa un gruppo di barre per una categoria: le serie con lo
// stesso stackedName condividono un solo slot, non ne aprono uno ciascuna
// (K9, usato da axis.tsx per centrare la label di categoria sul gruppo
// invece che su una singola barra).
export const getGroupBarSlotCount = (elements: Serie[]) => {
	const groupBarSeries = elements.filter((el) => el.type === "group-bar");
	const nonStackedCount = groupBarSeries.filter((el) => !el.stackedName).length;
	const uniqueStackedNames = new Set(
		groupBarSeries.filter((el) => el.stackedName).map((el) => el.stackedName),
	);
	return nonStackedCount + uniqueStackedNames.size;
};

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

	const serieIndex = barSeries.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		barGroupGap: ctxBarGroupGap,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	const xAxisGroupInterval =
		(chartXEnd - chartXStart) / timeSerieData?.length || 1;

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartYEnd - padding,
		);

		const serieY = isDefined(serieEl.value) ? chartYEnd - value : null;

		const barWidth = ctxBarWidth ?? padding;
		// Incremento diretto barWidth+gap invece che derivato da
		// xAxisInterval: cosi' le barre dello stesso gruppo restano vicine
		// indipendentemente da quanto spazio la categoria ha a disposizione
		// (K8).
		const barGap = ctxBarGroupGap ?? padding / 4;
		const serieElX =
			serieElIndex * xAxisGroupInterval +
			(barWidth + barGap) * serieIndex +
			(chartXStart + padding / 4);

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

	const serieGroupIndex = ctx.elements
		.reduce((acc, el) => {
			if (el.stackedName && uniqueStackedNames.includes(el.stackedName)) {
				// Una sola occorrenza per stackedName: le altre serie dello
				// stesso gruppo condividono lo stesso slot, non ne aprono uno
				// nuovo.
				if (!acc.includes(el.stackedName)) {
					acc.push(el.stackedName);
				}
			} else {
				acc.push(el.name);
			}
			return acc;
		}, [] as string[])
		.findIndex((el) => el === serie.stackedName || el === serie.name);

	if (serieGroupIndex < 0) return null;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		barWidth: ctxBarWidth,
		barGroupGap: ctxBarGroupGap,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	const xAxisGroupInterval =
		(chartXEnd - chartXStart) / timeSerieData?.length || 1;

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

		// Incremento diretto barWidth+gap invece che derivato da
		// xAxisInterval/groupBarNumber: cosi' le barre dello stesso gruppo
		// restano vicine indipendentemente da quanto spazio la categoria ha
		// a disposizione (K8).
		const barGap = ctxBarGroupGap ?? padding / 4;
		const serieElX =
			serieElIndex * xAxisGroupInterval +
			(barWidth + barGap) * serieGroupIndex +
			(chartXStart + padding / 2);

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
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
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
	const chartXStart = (_chartXStart as number) + effectiveBarOffset;
	const chartXEnd = (_chartXEnd as number) - 8;
	const chartYEnd = _chartYEnd as number;

	const yAxisInterval = (chartYEnd - padding) / timeSerieData?.length || 1;

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartXEnd - chartXStart - padding,
		);
		const serieX = isDefined(serieEl.value) ? chartXStart + value : null;
		const barHeight = ctxBarWidth ?? padding;
		const serieElY = yAxisInterval * serieElIndex + padding / 2;

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
