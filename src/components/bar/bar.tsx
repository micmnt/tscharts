import { useCallback, useMemo } from "react";

import {
	type CanvasDrawOp,
	type CanvasHitRegion,
	useCanvasLayer,
} from "../../contexts/canvasContext";

import { useCanvasHit } from "../../hooks/useCanvasHit";
import { useCanvasMark } from "../../hooks/useCanvasMark";
import { useSerie } from "../../hooks/useSerie";

import { fillPathSolid, paintTexts } from "../../lib/canvas/paint";

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

	onBarClick?: (value: unknown) => void;

	onBarDrag?: (value: BarDragPayload) => void;
};

const valueLabelText = (
	serie:
		| { data?: { value: number }[]; format?: (v: number) => unknown }
		| undefined,
	index: number,
): string => {
	const value = serie?.data?.[index]?.value;
	if (serie?.format) return String(serie.format(value as number));
	return value == null ? "" : String(value);
};

const Bar = (props: BarProps) => {
	const {
		name,
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

	const dragValueDecimals = props.dragValueDecimals ?? 2;
	const radius = props.radius ?? 0;
	const topLeftRadius = props.topLeftRadius ?? 0;
	const topRightRadius = props.topRightRadius ?? 0;
	const bottomRightRadius = props.bottomRightRadius ?? 0;
	const bottomLeftRadius = props.bottomLeftRadius ?? 0;
	const labelSize = props.labelSize ?? 12;
	const topLabelSize = props.topLabelSize ?? 12;
	const labelColor = props.labelColor ?? "white";
	const topLabelColor = props.topLabelColor ?? "black";
	const onBarClick = props.onBarClick;
	const onBarDrag = props.onBarDrag;

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

	const { paths, dataPoints, topLabelsPoints } = result ?? {};

	const serieIndex = elements?.findIndex(
		(el) => el.name === serieElement?.name,
	);

	const serieColor =
		serieElement?.color ??
		theme?.seriesColors?.[serieIndex ?? 0] ??
		theme?.seriesColors?.[0];

	const barPoints = dataPoints?.get(serieElement?.name ?? "") ?? [];
	const labelsPoints = topLabelsPoints?.get(serieElement?.name ?? "") ?? [];
	const axisSeries = getSeriesByAxisName(
		elements ?? [],
		serieElement?.axisName ?? serieElement?.name ?? "",
	);
	const flatAxisSeriesData = axisSeries.flat();
	const associatedThresholds =
		elements && serieElement
			? getSerieAssociatedThresholds(elements, serieElement.name)
			: [];
	const serieMaxValue = getTimeSerieMaxValue([
		...flatAxisSeriesData,
		...associatedThresholds,
	]);
	const dragMaxValue = ctx?.flatMax
		? calculateFlatValue(serieMaxValue)
		: serieMaxValue;
	const chartHeight = Math.max(1, (ctx?.chartYEnd ?? 0) - padding);
	const normalizedDragDecimals = Math.max(0, Math.floor(dragValueDecimals));
	const decimalFactor = 10 ** normalizedDragDecimals;

	const validBarPaths = useMemo(
		() =>
			(paths ?? []).filter(
				(p): p is string =>
					p != null && !p.includes("NaN") && !p.includes("Infinity"),
			),
		[paths],
	);

	const handleBarClick = useCallback(
		(pathIndex: number) => {
			if (onBarClick && isFunction(onBarClick) && serieElement) {
				onBarClick(serieElement.data[pathIndex]);
			}
		},
		[onBarClick, serieElement],
	);

	const startBarDrag = useCallback(
		(pathIndex: number, event: PointerEvent) => {
			if (!onBarDrag || !isFunction(onBarDrag) || !serieElement) return;

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
				const rawDeltaValue = (deltaPixels / chartHeight) * dragMaxValue;

				const rawValue = ctx?.negative
					? currentValue + rawDeltaValue
					: Math.max(0, currentValue + rawDeltaValue);
				const value = Math.round(rawValue * decimalFactor) / decimalFactor;
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
		},
		[onBarDrag, serieElement, dragMaxValue, chartHeight, decimalFactor, ctx],
	);

	const canvasLayer = useCanvasLayer();
	const isCanvas = !!canvasLayer;
	const drawOp = useCallback<CanvasDrawOp>(
		(g) => {
			const color = serieColor ?? "#000";
			for (const d of validBarPaths) fillPathSolid(g, d, color, 1);

			if (topLabelSerie && topLabelSerieElement) {
				paintTexts(
					g,
					(labelsPoints as [number, number][])
						.map((p, i) => ({
							x: p[0],
							y: Number.isNaN(p[1]) ? 0 : p[1],
							text: valueLabelText(topLabelSerieElement, i),
						}))
						.filter((it) => it.x > -1),
					topLabelColor,
					topLabelSize,
				);
			}
			if (showLabels) {
				paintTexts(
					g,
					(barPoints as [number, number][])
						.map((p, i) => ({
							x: p[0],
							y: Number.isNaN(p[1]) ? 0 : p[1],
							text: valueLabelText(serieElement, i),
						}))
						.filter((it) => it.x > -1),
					labelColor,
					labelSize,
				);
			}
		},
		[
			validBarPaths,
			serieColor,
			showLabels,
			barPoints,
			serieElement,
			labelColor,
			labelSize,
			topLabelSerie,
			topLabelSerieElement,
			labelsPoints,
			topLabelColor,
			topLabelSize,
		],
	);
	const hitRegions = useMemo<CanvasHitRegion[] | null>(() => {
		if (!onBarClick && !onBarDrag) return null;
		return validBarPaths.map((d, i) => ({
			d,
			onClick: onBarClick ? () => handleBarClick(i) : undefined,
			onPointerDown: onBarDrag
				? (event: PointerEvent) => startBarDrag(i, event)
				: undefined,
		}));
	}, [validBarPaths, onBarClick, onBarDrag, handleBarClick, startBarDrag]);
	useCanvasMark(isCanvas && result ? drawOp : null);
	useCanvasHit(isCanvas && result ? hitRegions : null);

	if (!ctx || !theme || !serieElement) return null;
	if (!result) return null;
	if (!ctx.chartXEnd || !ctx.chartYEnd || !paths) return null;

	if (isCanvas) {
		if (!onBarClick) return null;
		return (
			<>
				{validBarPaths.map((p, pathIndex) => (
					<path
						key={`${serieElement.name}-bar-a11y-${pathIndex}`}
						d={p}
						fill="none"
						stroke="none"
						style={{ pointerEvents: "none" }}
						tabIndex={0}
						role="button"
						aria-label={`${serieElement.name} ${
							serieElement.data[pathIndex]?.date ?? pathIndex
						}: ${serieElement.data[pathIndex]?.value ?? ""}`}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								handleBarClick(pathIndex);
							}
						}}
					/>
				))}
			</>
		);
	}

	return (
		<>
			{validBarPaths.map((p, pathIndex) => (
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
					onPointerDown={(event) => startBarDrag(pathIndex, event.nativeEvent)}
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
