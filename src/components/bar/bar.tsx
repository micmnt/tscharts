/* Types Imports */

/* React Imports */
import { Fragment, useCallback, useMemo } from "react";
/* Context Imports */
import {
	type CanvasDrawOp,
	type CanvasHitRegion,
	useCanvasLayer,
} from "../../contexts/canvasContext";
/* Hooks Imports */
import { useCanvasHit } from "../../hooks/useCanvasHit";
import { useCanvasMark } from "../../hooks/useCanvasMark";
import { useDeprecatedConfigWarning } from "../../hooks/useDeprecatedConfig";
import { useSerie } from "../../hooks/useSerie";
/* Canvas Imports */
import { fillPathSolid, paintTexts } from "../../lib/canvas/paint";
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

// Testo di una label di valore (come SerieValueLabels): format(value) oppure il
// valore grezzo; stringa vuota se assente. Usato per disegnare le label su canvas.
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

	// --- Derivazioni GUARDATE (sicure anche prima che i dati siano pronti):
	// servono sia al ramo SVG sia alla draw-op/hit-region canvas, costruite PRIMA
	// degli early-return (regola degli hook). ---
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

	// Path validi (scarto NaN/Infinity): fonte comune di render SVG, disegno
	// canvas e hit-region. NB: l'indice del path valido e' l'indice del dato
	// (come nel render SVG storico).
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

	// Drag della barra: identico al comportamento SVG (pixel verticali ->
	// variazione di valore su chartHeight x dragMaxValue), estratto per essere
	// riusato dal ramo canvas (l'hit-region chiama questa). Riceve la PointerEvent
	// nativa (dall'onPointerDown React o dal hit-test del CanvasSurface).
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
				// Il valore puo' scendere sotto zero solo se il grafico ammette valori
				// negativi: altrimenti trascinare una barra gia' negativa la farebbe
				// collassare a 0 al primo movimento invece di lasciarla scendere.
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

	// --- Canvas (increment 2): barre riempite su un nodo + hit-region per il
	// click/drag (isPointInPath dal CanvasSurface). NO-OP in modalita' SVG. ---
	const canvasLayer = useCanvasLayer();
	const isCanvas = !!canvasLayer;
	const drawOp = useCallback<CanvasDrawOp>(
		(g) => {
			const color = serieColor ?? "#000";
			for (const d of validBarPaths) fillPathSolid(g, d, color, 1);
			// Label sopra le barre (topLabelSerie) e di valore (showLabels): stessa
			// posizione/formato di SerieValueLabels, disegnate con fillText (2b).
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

	// Canvas-mode: le barre (e le label) sono sul bitmap. Per l'a11y, se le barre
	// sono cliccabili disegno path INVISIBILI ma focusabili (2b): tastiera
	// (Tab+Enter) e screen reader funzionano, il mouse/touch passa al canvas
	// (pointer-events:none -> hit-test). Senza onBarClick: nessun nodo (0 DOM).
	if (isCanvas) {
		if (!onBarClick) return null;
		return (
			<>
				{validBarPaths.map((p, pathIndex) => (
					<Fragment key={`${serieElement.name}-bar-a11y-${pathIndex}`}>
						{/* biome-ignore lint/a11y/useSemanticElements: un <path> SVG non
						    puo' essere un <button>; role+tabIndex e' l'unico modo per
						    rendere focusabile/attivabile da tastiera una barra su canvas. */}
						<path
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
					</Fragment>
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
