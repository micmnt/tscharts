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
import {
	type BandScale,
	createBandScale,
	getChartTimeScale,
	getChartYScale,
} from "./scales";
import {
	calculateStackedSeriesMax,
	getEffectiveMaxValue,
	getSerieMaxValueForAxis,
	getTimeSerieMaxValue,
	normalizeTime,
} from "./series";

const initSerieAccumulators = (serieName: string) => {
	const dataPoints = new Map();
	dataPoints.set(serieName, []);

	const topLabelsPoints = new Map();
	topLabelsPoints.set(serieName, []);

	return { dataPoints, topLabelsPoints };
};

const createXPositioner = (
	ctx: ChartState & { padding: number },
	xScale: BandScale,
	centerOffset: number,
): ((index: number, date: string) => number) => {
	const timeScale = ctx.scaleType === "time" ? getChartTimeScale(ctx) : null;

	if (!timeScale) return (index) => xScale.position(index);

	return (_index, date) =>
		timeScale.position(normalizeTime(date, ctx.parseDate)) - centerOffset;
};

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

	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: padding / 2,
	});

	const barWidth = ctxBarWidth ?? padding;
	const positionX = createXPositioner(ctx, xScale, barWidth / 2);

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

		const serieElX = positionX(serieElIndex, serieEl.date);

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

	const xSpacing = globalConfig?.barWidth
		? Number(globalConfig?.barWidth) / 2
		: padding;

	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: type === "bar" ? padding / 2 : padding / 2 + xSpacing,
	});

	const barWidth = ctxBarWidth ?? padding;
	const positionX = createXPositioner(
		ctx,
		xScale,
		type === "bar" ? barWidth / 2 : 0,
	);

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const zeroY = ctx.chartYMiddle ?? 0;

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
			const serieElX = positionX(serieElIndex, serieEl.date);

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
		const serieElX = positionX(serieElIndex, serieEl.date);

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

	const xSpacing = globalConfig?.barWidth
		? Number(globalConfig?.barWidth) / 2
		: padding;

	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: type === "bar" ? padding / 2 : padding / 2 + xSpacing,
	});

	const barWidth = ctxBarWidth ?? padding;
	const positionX = createXPositioner(
		ctx,
		xScale,
		type === "bar" ? barWidth / 2 : 0,
	);

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

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

		const value = hasCustomYDomain
			? serieY !== null
				? chartYEnd - serieY
				: 0
			: getValuePosition(flatMaxValue, serieEl.value ?? 0, chartYEnd - padding);

		if (type === "bar") {
			const serieElX = positionX(serieElIndex, serieEl.date);

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
		const serieElX = positionX(serieElIndex, serieEl.date);

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

const getGroupBarSlotKeys = (elements: Serie[]) => {
	const groupBarSeries = elements.filter((el) => el.type === "group-bar");
	return groupBarSeries.reduce<string[]>((acc, el) => {
		const key = el.stackedName ?? el.name;
		if (!acc.includes(key)) acc.push(key);
		return acc;
	}, []);
};

export const getGroupBarSlotCount = (elements: Serie[]) =>
	getGroupBarSlotKeys(elements).length;

export const getGroupBarSlotIndex = (elements: Serie[], serie: TimeSerie) =>
	getGroupBarSlotKeys(elements).indexOf(serie.stackedName ?? serie.name);

const getGroupWidth = (
	elements: Serie[] | undefined,
	barWidth: number,
	barGap: number,
) => {
	const slotCount = getGroupBarSlotCount(elements ?? []);
	return slotCount * barWidth + Math.max(0, slotCount - 1) * barGap;
};

export const getCategorySpacing = (
	elements: Serie[],
	globalConfig: GlobalConfig | undefined,
	padding: number,
): number => {
	const hasGroupBar = elements.some((el) => el.type === "group-bar");

	if (hasGroupBar) {
		const barWidth = globalConfig?.barWidth
			? Number(globalConfig.barWidth)
			: padding;
		const barGroupGap = globalConfig?.barGroupGap
			? Number(globalConfig.barGroupGap)
			: padding / 4;
		return padding / 2 + getGroupWidth(elements, barWidth, barGroupGap) / 2;
	}

	return globalConfig?.barWidth
		? (Number(globalConfig.barWidth) + padding) / 2
		: padding;
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

	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: padding / 2,
	});

	const barWidth = ctxBarWidth ?? padding;
	const barGap = ctxBarGroupGap ?? padding / 4;
	const positionX = createXPositioner(
		ctx,
		xScale,
		getGroupWidth(ctx.elements, barWidth, barGap) / 2,
	);

	const flatMaxValue = getEffectiveMaxValue(ctx.flatMax, serieMaxValue);

	const paths = timeSerieData?.map((serieEl, serieElIndex) => {
		const value = getValuePosition(
			flatMaxValue,
			serieEl.value ?? 0,
			chartYEnd - padding,
		);

		const serieY = isDefined(serieEl.value) ? chartYEnd - value : null;

		const serieElX =
			positionX(serieElIndex, serieEl.date) + (barWidth + barGap) * serieIndex;

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

	const stackedSeries = ctx.elements.filter(
		(el): el is TimeSerie =>
			isTimeSerie(el) && el.stackedName === serie.stackedName,
	);

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

	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: timeSerieData?.length ?? 0,
		firstOffset: padding / 2,
	});

	const barWidth = ctxBarWidth ?? padding;
	const barGap = ctxBarGroupGap ?? padding / 4;
	const positionX = createXPositioner(
		ctx,
		xScale,
		getGroupWidth(ctx.elements, barWidth, barGap) / 2,
	);

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

		const serieElX =
			positionX(serieElIndex, serieEl.date) +
			(barWidth + barGap) * serieGroupIndex;

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

	const effectiveBarOffset =
		typeof barOffset === "number" ? barOffset : DEFAULT_HORIZONTAL_BAR_OFFSET;
	const chartXStart = rawChartXStart + effectiveBarOffset;
	const chartXEnd = rawChartXEnd - 8;

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
