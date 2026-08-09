/* Types Imports */

/* React Imports */
import { useMemo } from "react";
/* Hooks Imports */
import { useSerie } from "../../hooks/useSerie";
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
import defaultTheme from "../../lib/defaultTheme";
import { calculateFlatValue, isFunction, isTimeSerie } from "../../lib/utils";
import { SerieValueLabels } from "../shared/SerieValueLabels";

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

	const {
		ctx,
		theme,
		serie: serieElement,
	} = useSerie(name, isTimeSerie, {
		component: "Bar",
		serieTypeLabel: "bar/line/bar-stacked/group-bar",
	});

	const { padding = defaultTheme.padding } = theme ?? {};

	const {
		dragValueDecimals = 2,
		radius = 0,
		topLeftRadius = 0,
		topRightRadius = 0,
		bottomRightRadius = 0,
		bottomLeftRadius = 0,
		labelSize = 12,
		topLabelSize = 12,
		labelColor = "white",
		topLabelColor = "black",
	} = config || {};

	// barWidth/barOffset sono config di layout condivisa: dalla v1.0 arrivano da
	// <Chart> attraverso globalConfig (M1), non piu' dal config della serie (che
	// resta accettato ma deprecato: computeGlobalConfig lo inoltra qui).
	const barWidth = ctx?.globalConfig?.barWidth ?? padding;
	const barOffset = ctx?.globalConfig?.barOffset;

	const elements = ctx?.elements;

	const foundTopLabelSerieElement = elements?.find(
		(el) => el.name === topLabelSerie,
	);
	const topLabelSerieElement =
		foundTopLabelSerieElement && isTimeSerie(foundTopLabelSerieElement)
			? foundTopLabelSerieElement
			: undefined;

	// ctx (ChartStructuralContext) e' ora una reference stabile tra un
	// mousemove e l'altro (vedi C2): dipendere dall'intero ctx invece che dai
	// singoli campi e' sicuro e piu' semplice da mantenere corretto.
	const result = useMemo(() => {
		if (!ctx || !theme || !serieElement) return null;

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

		if (stacked) return generateStackedDataPaths(serieElement, pathsConfig);
		if (ctx.negative)
			return generateNegativeDataPaths(serieElement, pathsConfig, "bar");
		if (horizontal)
			return generateHorizontalDataPaths(serieElement, pathsConfig, "bar");
		return generateDataPaths(serieElement, pathsConfig, "bar");
	}, [
		ctx,
		theme,
		serieElement,
		padding,
		barWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomRightRadius,
		bottomLeftRadius,
		barOffset,
		stacked,
		horizontal,
	]);

	if (!ctx || !theme || !serieElement) return null;

	if (!result) return null;

	const { paths, dataPoints, topLabelsPoints } = result;

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
	const flatAxisSeriesData = axisSeries.flat();
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

	const handleBarClick = (pathIndex: number) => {
		if (config?.barClickAction && isFunction(config.barClickAction)) {
			const currentDataPoint = serieElement.data[pathIndex];
			config.barClickAction(currentDataPoint);
		}
	};

	if (!ctx.chartXEnd || !ctx.chartYEnd || !paths) return null;

	return (
		<>
			{paths
				.filter(
					(p) =>
						p !== null &&
						p !== undefined &&
						!p.includes("NaN") &&
						!p.includes("Infinity"),
				)
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
						tabIndex={config?.barClickAction ? 0 : undefined}
						role={config?.barClickAction ? "button" : undefined}
						onClick={() => handleBarClick(pathIndex)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								handleBarClick(pathIndex);
							}
						}}
						onPointerDown={(event) => {
							if (!config?.barDragAction || !isFunction(config.barDragAction)) {
								return;
							}

							// event.preventDefault();

							const currentDataPoint = serieElement.data[pathIndex];
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
								// Il valore puo' scendere sotto zero solo se il grafico
								// ammette valori negativi: altrimenti trascinare una barra
								// gia' negativa la farebbe collassare a 0 al primo
								// movimento invece di lasciarla scendere ulteriormente.
								const rawValue = ctx.negative
									? currentValue + rawDeltaValue
									: Math.max(0, currentValue + rawDeltaValue);
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
			{topLabelSerie && (
				<SerieValueLabels
					points={labelsPoints}
					serie={topLabelSerieElement}
					fontSize={topLabelSize}
					color={topLabelColor}
					keyPrefix={`${serieElement.name}-top-label`}
				/>
			)}
			{showLabels && (
				<SerieValueLabels
					points={barPoints}
					serie={serieElement}
					fontSize={labelSize}
					color={labelColor}
					keyPrefix={`${serieElement.name}-label`}
				/>
			)}
		</>
	);
};

export default Bar;
