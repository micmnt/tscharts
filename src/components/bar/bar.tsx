/* Types Imports */

/* React Imports */
import { useMemo } from "react";
/* Hooks Imports */
import { useDeprecatedConfigWarning } from "../../hooks/useDeprecatedConfig";
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
	// Props piatte (v1.0): sostituiscono il vecchio oggetto `config`.
	radius?: number;
	topLeftRadius?: number;
	topRightRadius?: number;
	bottomRightRadius?: number;
	bottomLeftRadius?: number;
	labelSize?: number;
	labelColor?: string;
	topLabelSize?: number;
	topLabelColor?: string;
	dragValueDecimals?: number;
	// Click sulla singola barra (era config.barClickAction). Il click sulle label
	// dell'asse e' invece <Axis onLabelClick> (M2).
	onBarClick?: (value: unknown) => void;
	// Drag della singola barra (era config.barDragAction).
	onBarDrag?: (value: BarDragPayload) => void;
	/**
	 * @deprecated Usa le props piatte di <Bar> (radius, labelSize, onBarClick,
	 * onBarDrag, ...). barWidth/barOffset vanno su <Chart> (M1),
	 * selectedValue/selectedColor su <Axis> (M2). Rimozione nella 2.0.
	 */
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

// Chiavi "bar-local" del config deprecato (per l'avviso M4). Escluse quelle
// gia' rilocate: barWidth/barOffset (M1 -> Chart), selectedValue/selectedColor
// (M2 -> Axis), che avvisano in computeGlobalConfig.
const BAR_LOCAL_CONFIG_KEYS = [
	"radius",
	"topLeftRadius",
	"topRightRadius",
	"bottomRightRadius",
	"bottomLeftRadius",
	"labelSize",
	"labelColor",
	"topLabelSize",
	"topLabelColor",
	"dragValueDecimals",
	"barClickAction",
	"barDragAction",
] as const;

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

	// v1.0: props piatte con fallback al `config` deprecato (la prop piatta vince).
	useDeprecatedConfigWarning(
		config,
		BAR_LOCAL_CONFIG_KEYS,
		"Bar",
		"radius, labelSize, labelColor, onBarClick, onBarDrag",
	);

	const dragValueDecimals =
		props.dragValueDecimals ?? config?.dragValueDecimals ?? 2;
	const radius = props.radius ?? config?.radius ?? 0;
	const topLeftRadius = props.topLeftRadius ?? config?.topLeftRadius ?? 0;
	const topRightRadius = props.topRightRadius ?? config?.topRightRadius ?? 0;
	const bottomRightRadius =
		props.bottomRightRadius ?? config?.bottomRightRadius ?? 0;
	const bottomLeftRadius =
		props.bottomLeftRadius ?? config?.bottomLeftRadius ?? 0;
	const labelSize = props.labelSize ?? config?.labelSize ?? 12;
	const topLabelSize = props.topLabelSize ?? config?.topLabelSize ?? 12;
	const labelColor = props.labelColor ?? config?.labelColor ?? "white";
	const topLabelColor = props.topLabelColor ?? config?.topLabelColor ?? "black";
	const onBarClick = props.onBarClick ?? config?.barClickAction;
	const onBarDrag = props.onBarDrag ?? config?.barDragAction;

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
		if (onBarClick && isFunction(onBarClick)) {
			const currentDataPoint = serieElement.data[pathIndex];
			onBarClick(currentDataPoint);
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
							cursor: onBarDrag ? "ns-resize" : "default",
							touchAction: "none",
							transition: "d 90ms linear",
						}}
						tabIndex={onBarClick ? 0 : undefined}
						role={onBarClick ? "button" : undefined}
						onClick={() => handleBarClick(pathIndex)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								handleBarClick(pathIndex);
							}
						}}
						onPointerDown={(event) => {
							if (!onBarDrag || !isFunction(onBarDrag)) {
								return;
							}

							// event.preventDefault();

							const currentDataPoint = serieElement.data[pathIndex];
							const currentValue = currentDataPoint?.value ?? 0;

							if (dragMaxValue <= 0) {
								onBarDrag({
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

								onBarDrag?.({
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
