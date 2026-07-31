import type { ChartState, TimeSerie } from "../../types";
import { calculateFlatValue, isTimeSerie } from "../utils";
import { generateVerticalLine } from "./primitives";
import {
	calculateStackedSeriesMax,
	getEffectiveMaxValue,
	getSerieAssociatedThresholds,
	getSeriesByAxisName,
	getTimeSerieMaxValue,
	normalizeSerieElementsData,
} from "./series";

//Funzione che dato un array di serie, calcola il numero di assi che devono essere a sinistra e a destra del grafico
export const getAxisCount = (yAxisCount = 0) => {
	const isSeriesCountEven = yAxisCount % 2 === 0;

	// Se il numero di serie da graficare è dispari, voglio avere sempre un asse in più a sinistra del grafico
	const leftAxisCount = isSeriesCountEven
		? yAxisCount / 2
		: Math.floor(yAxisCount / 2) + 1;
	const rightAxisCount = Math.floor(yAxisCount / 2);

	return { leftAxisCount, rightAxisCount };
};

// Funzione che preso in ingresso la larghezza e l'altezza dell'svg,
// il numero di assi a destra e sinistra del grafico e
// lo spazio di padding calcola i punti di inizio e fine in lunghezza e larghezza del grafico
export const getChartDimensions = (
	padding: number,
	svgWidth: number,
	svgHeight: number,
	leftAxisCount: number,
	rightAxisCount: number,
	legendHeight: number,
) => {
	// Margine orizzontale riservato per ogni asse Y, espresso come multiplo di `padding`.
	const xPaddingMultiplier = 3;
	// Margine verticale riservato sotto il grafico (asse X + legenda), espresso come multiplo di `padding`.
	const yPaddingMultiplier = 4;
	const chartXStart = xPaddingMultiplier * padding * leftAxisCount;
	const chartXEnd =
		svgWidth -
		padding * xPaddingMultiplier * (rightAxisCount || 1 / xPaddingMultiplier);
	const chartYEnd = svgHeight - yPaddingMultiplier * padding - legendHeight;

	return { chartXStart, chartXEnd, chartYEnd };
};

// Funzione che genera l'asse x
export const generateXAxis = (ctx: ChartState & { padding: number }) => {
	const { chartXStart, chartXEnd, chartYEnd: _chartYEnd, negative } = ctx;
	const chartYEnd = _chartYEnd as number;

	const normalizedChartYEnd = negative ? ctx.chartYMiddle : chartYEnd;

	return {
		path: `M ${chartXStart} ${normalizedChartYEnd} H ${chartXEnd}`,
	};
};

// funzione che genera gli assi di un grafico
export const generateYAxis = (
	serie: TimeSerie,
	ctx: ChartState & { padding: number; yInterval: number },
) => {
	const isStacked = serie.type === "bar-stacked";
	const isGroupStacked = serie.stackedName;

	if (!ctx.elements) return null;

	const seriesThresholds = getSerieAssociatedThresholds(
		ctx.elements,
		serie.name,
	);

	const axisSeries = getSeriesByAxisName(
		ctx.elements,
		serie.axisName ?? serie.name,
	);

	const flatAxisSeriesData = axisSeries.flat();

	let serieMaxValue = 0;
	let negativeSerieMaxValue = 0;
	if (ctx.negative) {
		const normalizedElements = normalizeSerieElementsData(ctx.elements);
		const negativeSeries = normalizedElements.filter((el) =>
			el.data?.some((dataEl) => dataEl.value < 0),
		);
		const positiveSeries = normalizedElements.filter(
			(el) => !el.data?.some((dataEl) => dataEl.value < 0),
		);
		serieMaxValue = getTimeSerieMaxValue([
			...positiveSeries.flatMap((el) => el.data),
		]);
		negativeSerieMaxValue = getTimeSerieMaxValue([
			...negativeSeries.flatMap((el) => el.data),
		]);
	} else if (isStacked) {
		serieMaxValue = calculateStackedSeriesMax(
			ctx.elements.filter((el): el is TimeSerie => el.type === "bar-stacked"),
		);
	} else if (isGroupStacked) {
		// Listo tutte le serie non stacked
		const nonStackedSeries = ctx.elements.filter(
			(el): el is TimeSerie => el.type === "group-bar" && !el.stackedName,
		);

		const allStackedSeries = ctx.elements.filter(
			(el): el is TimeSerie => el.type === "group-bar" && !!el.stackedName,
		);

		const allStackedNames = allStackedSeries.map((el) => el.stackedName);
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
		serieMaxValue = stackedMaxValue;
	} else {
		serieMaxValue = getTimeSerieMaxValue([
			...flatAxisSeriesData,
			...(seriesThresholds ?? []),
		]);
	}

	// Solo tra le serie che possono avere un proprio asse Y (le altre, come
	// soglie/pie/donut/angle-donut, non ne hanno mai uno): usare la posizione
	// grezza nell'intero ctx.elements sfaserebbe l'alternanza sinistra/destra
	// ogni volta che un elemento senza asse e' intercalato tra due serie che
	// invece ce l'hanno.
	const serieIndex = ctx.elements
		.filter(isTimeSerie)
		.findIndex((el) => el.name === serie.name);

	if (serieIndex < 0) return null;

	const {
		height: _height,
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		padding,
		yInterval,
	} = ctx;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;
	const height = _height as number;

	const yAxisInterval = (chartYEnd - padding) / yInterval;

	const isOppositeAxis = serieIndex % 2 !== 0;

	/* Creazione degli assi */
	const axisX = isOppositeAxis ? chartXEnd : chartXStart + padding / 2;

	const axisPath = generateVerticalLine(axisX, chartYEnd, 0);

	// creazione delle label degli assi e del nome verticale degli assi
	const axisLabelsX = isOppositeAxis
		? axisX + (3 / 2) * padding * (serieIndex - 1) + padding / 2
		: axisX - (3 / 2) * padding * serieIndex - padding / 2;

	const nameLabelX = isOppositeAxis
		? axisLabelsX + 2 * padding
		: axisLabelsX - (5 / 2) * padding;

	const nameLabelAxisPath = generateVerticalLine(
		nameLabelX,
		0,
		height - 3 * padding,
	);

	if (ctx.negative) {
		const negativeAndPositiveSerieMaxValue = Math.max(
			serieMaxValue,
			negativeSerieMaxValue,
		);

		const flatMaxValue = getEffectiveMaxValue(
			ctx.flatMax,
			negativeAndPositiveSerieMaxValue,
		);

		const zeroY = ctx.chartYMiddle ?? 0;

		// Stessa definizione di halfHeight usata in generateNegativeDataPaths:
		// spazio simmetrico sopra/sotto lo zero, cosi' le gridline restano
		// sempre dentro il canvas e coincidono con la posizione reale di
		// barre/linee/soglie per lo stesso valore.
		const halfHeight = zeroY - padding;

		const getAxisY = (axisValue: number) =>
			zeroY - (axisValue / flatMaxValue) * halfHeight;

		const firstValue = serie.format
			? serie.format(flatMaxValue * -1)
			: flatMaxValue * -1;

		const lastValue = serie.format ? serie.format(flatMaxValue) : flatMaxValue;

		const yAxisLabels = [
			{
				value: firstValue,
				x: axisLabelsX,
				y: getAxisY(flatMaxValue * -1),
			},
		];

		for (
			let i = Math.floor(yInterval / 2) * -1;
			i < Math.ceil(yInterval / 2);
			i++
		) {
			const flatInterval = ctx.flatMax
				? calculateFlatValue(flatMaxValue / Math.ceil(yInterval / 2))
				: flatMaxValue / Math.ceil(yInterval / 2);

			const axisValue = flatInterval * i === 0 ? 0 : flatInterval * i * -1;

			const serieValue = serie.format ? serie.format(axisValue) : axisValue;

			const element = {
				value: serieValue,
				x: axisLabelsX,
				y: getAxisY(axisValue),
			};

			yAxisLabels.push(element);
		}

		yAxisLabels.push({
			value: lastValue,
			x: axisLabelsX,
			y: getAxisY(flatMaxValue),
		});

		return {
			valueLabels: yAxisLabels,
			isOpposite: isOppositeAxis,
			uom: serie.uom,
			name: serie.name,
			path: axisPath,
			nameLabelPath: nameLabelAxisPath,
		};
	}

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const lastValue = serie.format ? serie.format(flatMaxValue) : flatMaxValue;

	const yAxisLabels = [...Array(yInterval)]
		.map((_, index) => {
			const flatInterval = flatMaxValue / yInterval;
			const axisValue = flatInterval * index;

			const serieValue = serie.format ? serie.format(axisValue) : axisValue;

			return {
				value: serieValue,
				x: axisLabelsX,
				y: chartYEnd - yAxisInterval * index,
			};
		})
		.concat({
			value: lastValue,
			x: axisLabelsX,
			y: chartYEnd - yAxisInterval * yInterval,
		});

	return {
		valueLabels: yAxisLabels,
		isOpposite: isOppositeAxis,
		uom: serie.uom,
		name: serie.name,
		path: axisPath,
		nameLabelPath: nameLabelAxisPath,
	};
};
