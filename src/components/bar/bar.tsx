/* Types Imports */

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
/* Core Imports */
import {
	generateDataPaths,
	generateHorizontalDataPaths,
	generateNegativeDataPaths,
	generateStackedDataPaths,
	getSerieAssociatedThresholds,
	getSeriesByAxisName,
	getTimeSerieMaxValue,
} from "../../lib/core";
import { calculateFlatValue, isFunction } from "../../lib/utils";
import type { ThemeState, TimeSerieEl } from "../../types";

export type BarDragPayload = {
	value: number;
	previousValue: number;
	deltaValue: number;
	index: number;
	date?: string;
	serieName: string;
};

export type BarProps = {
	name: string;
	stacked?: boolean;
	showLabels?: boolean;
	topLabelSerie?: string;
	horizontal?: boolean;
	config?: {
		selectedColor?: string;
		selectedValue?: string;
		barClickAction?: (value: unknown) => void;
		barDragAction?: (value: BarDragPayload) => void;
		dragValueDecimals?: number;
		radius?: number;
		topLeftRadius?: number;
		topRightRadius?: number;
		bottomRightRadius?: number;
		bottomLeftRadius?: number;
		barWidth?: number;
		labelSize?: number;
		topLabelSize?: number;
		labelColor?: string;
		topLabelColor?: string;
		barOffset?: number;
	};
};

const Bar = (props: BarProps) => {
	const {
		name,
		config,
		stacked = false,
		showLabels = false,
		topLabelSerie = "",
		horizontal = false,
	} = props;

	const ctx = useCharts();

	const theme = useChartsTheme() as ThemeState;

	if (!ctx || !theme) return null;

	const { elements } = ctx;

	const { padding } = theme;

	const {
		dragValueDecimals = 2,
		radius = 0,
		topLeftRadius = 0,
		topRightRadius = 0,
		bottomRightRadius = 0,
		bottomLeftRadius = 0,
		barWidth = padding,
		labelSize = 12,
		topLabelSize = 12,
		labelColor = "white",
		topLabelColor = "black",
		barOffset = undefined,
	} = config || {};

	const serieElement = elements?.find((el) => el.name === name);

	const topLabelSerieElement = elements?.find(
		(el) => el.name === topLabelSerie,
	);

	if (!serieElement) return null;

	// Oggetto di configurazione per il calcolo dei paths svg
	const pathsConfig = {
		...ctx,
		padding,
		barWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		barOffset,
	};

	let result: {
		paths: string[];
		dataPoints: Map<any, any>;
		topLabelsPoints: Map<any, any>;
	} | null = null;

	if (stacked) {
		result = generateStackedDataPaths(serieElement, pathsConfig);
	} else if (ctx.negative) {
		result = generateNegativeDataPaths(serieElement, pathsConfig, "bar");
	} else if (horizontal) {
		result = generateHorizontalDataPaths(serieElement, pathsConfig, "bar");
	} else {
		result = generateDataPaths(serieElement, pathsConfig, "bar");
	}

	const { paths, dataPoints, topLabelsPoints } = result ?? {};

	const serieIndex = elements?.findIndex((el) => el.name === serieElement.name);

	const serieColor =
		serieElement.color ??
		theme.seriesColors?.[serieIndex ?? 0] ??
		theme.seriesColors?.[0];

	const barPoints = dataPoints?.get(serieElement.name) ?? [];
	const labelsPoints = topLabelsPoints?.get(serieElement.name) ?? [];
	const axisSeries = getSeriesByAxisName(
		elements ?? [],
		serieElement.axisName ?? serieElement.name,
	);
	const flatAxisSeriesData = axisSeries.flat() as TimeSerieEl[];
	const associatedThresholds = elements
		? getSerieAssociatedThresholds(elements, serieElement.name)
		: [];
	const serieMaxValue = getTimeSerieMaxValue([
		...flatAxisSeriesData,
		...associatedThresholds,
	]);
	const dragMaxValue = ctx.flatMax
		? calculateFlatValue(serieMaxValue)
		: serieMaxValue;
	const chartHeight = Math.max(1, (ctx.chartYEnd ?? 0) - padding);
	const normalizedDragDecimals = Math.max(0, Math.floor(dragValueDecimals));
	const decimalFactor = 10 ** normalizedDragDecimals;

	if (!paths) return null;

	return (
		<>
			{paths
				.filter((p) => p !== null && p !== undefined && !p.includes("NaN"))
				.map((p, pathIndex) => (
					<path
						key={`${serieElement.name}-bar-${pathIndex}`}
						d={p}
						fill={serieColor}
						style={{
							cursor: config?.barDragAction ? "ns-resize" : "default",
							touchAction: "none",
							transition: "d 90ms linear",
						}}
						onPointerDown={(event) => {
							if (!config?.barDragAction || !isFunction(config.barDragAction)) {
								return;
							}

							event.preventDefault();

							const currentDataPoint = (serieElement.data as TimeSerieEl[])[
								pathIndex
							];
							const currentValue = currentDataPoint?.value ?? 0;

							if (dragMaxValue <= 0) {
								config.barDragAction({
									value: currentValue,
									previousValue: currentValue,
									deltaValue: 0,
									index: pathIndex,
									date: currentDataPoint?.date,
									serieName: serieElement.name,
								});
								return;
							}

							const startClientY = event.clientY;
							let lastClientY = startClientY;
							let rafId: number | null = null;

							const emitDragValue = (clientY: number) => {
								const deltaPixels = startClientY - clientY;
								const rawDeltaValue =
									(deltaPixels / chartHeight) * dragMaxValue;
								const rawValue = Math.max(0, currentValue + rawDeltaValue);
								const value =
									Math.round(rawValue * decimalFactor) / decimalFactor;
								const deltaValue = value - currentValue;

								config.barDragAction?.({
									value,
									previousValue: currentValue,
									deltaValue,
									index: pathIndex,
									date: currentDataPoint?.date,
									serieName: serieElement.name,
								});
							};

							const scheduleEmit = () => {
								if (rafId !== null) return;
								rafId = window.requestAnimationFrame(() => {
									rafId = null;
									emitDragValue(lastClientY);
								});
							};

							const onPointerMove = (moveEvent: PointerEvent) => {
								lastClientY = moveEvent.clientY;
								scheduleEmit();
							};

							const cleanup = () => {
								if (rafId !== null) {
									window.cancelAnimationFrame(rafId);
									rafId = null;
								}
								window.removeEventListener("pointermove", onPointerMove);
								window.removeEventListener("pointerup", onPointerUp);
								window.removeEventListener("pointercancel", onPointerUp);
							};

							const onPointerUp = () => {
								emitDragValue(lastClientY);
								cleanup();
							};

							window.addEventListener("pointermove", onPointerMove);
							window.addEventListener("pointerup", onPointerUp);
							window.addEventListener("pointercancel", onPointerUp);
						}}
					/>
				))}
			{topLabelSerie &&
				labelsPoints.map(
					(point: [x: number, y: number], dataPointIndex: number) =>
						point[0] > -1 ? (
							<text
								textAnchor="middle"
								fontSize={topLabelSize}
								fontWeight="bold"
								fill={topLabelColor}
								key={`${serieElement.name}-top-label-${dataPointIndex}`}
								x={point[0]}
								y={Number.isNaN(point[1]) ? 0 : point[1]}
							>
								{topLabelSerieElement?.format
									? topLabelSerieElement.format(
											(topLabelSerieElement?.data as TimeSerieEl[])?.[
												dataPointIndex
											]?.value,
										)
									: (topLabelSerieElement?.data as TimeSerieEl[])?.[
											dataPointIndex
										]?.value}
							</text>
						) : null,
				)}
			{showLabels &&
				barPoints
					.map((point: [x: number, y: number], dataPointIndex: number) =>
						point[0] > -1 ? (
							<text
								textAnchor="middle"
								fontSize={labelSize}
								fontWeight="bold"
								fill={labelColor}
								key={`${serieElement.name}-label-${dataPointIndex}`}
								x={point[0]}
								y={Number.isNaN(point[1]) ? 0 : point[1]}
							>
								{serieElement.format
									? serieElement.format(
											(serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
												?.value,
										)
									: (serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
											?.value}
							</text>
						) : null,
					)
					.filter((el: [x: number, y: number]) => el !== null)}
		</>
	);
};

export default Bar;
