import { useCanvasLayer } from "../contexts/canvasContext";
import {
	useChartsInteractive,
	useChartsStructural,
	useChartsTheme,
} from "../contexts/chartContext";
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

export type ChartMark = {
	x: (indexOrTime: number) => number;
	y: (value: number) => number;
	yInvert: (px: number) => number;
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
	serie?: TimeSerie;
	color?: string;
	hoveredIndex: number | null;
	scaleType: "band" | "time";
	horizontal: boolean;
	isCanvas: boolean;
};

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

	if (!width || !height || chartYEnd <= 0) return null;

	const yMax =
		ctx.yMax ?? getEffectiveMaxValue(ctx.flatMax, ctx.timeSeriesMaxValue ?? 0);
	const yMin = ctx.yMin ?? 0;
	const yScale = getChartYScale({ min: yMin, max: yMax, chartYEnd, padding });

	const found = name ? elements?.find((el) => el.name === name) : undefined;
	const serie = found && isTimeSerie(found) ? found : undefined;
	const serieIndex =
		name && elements ? elements.findIndex((el) => el.name === name) : -1;
	const color =
		serie?.color ??
		theme?.seriesColors?.[serieIndex >= 0 ? serieIndex : 0] ??
		theme?.seriesColors?.[0];

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

	const hOffset =
		typeof globalConfig?.barOffset === "number"
			? globalConfig.barOffset
			: DEFAULT_HORIZONTAL_BAR_OFFSET;
	const hStart = chartXStart + hOffset;
	const hEnd = chartXEnd - 8;
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
