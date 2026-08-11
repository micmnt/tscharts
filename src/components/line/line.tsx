/* Types Imports */

import { useCallback, useId, useMemo } from "react";
import {
	type CanvasDrawOp,
	useCanvasLayer,
} from "../../contexts/canvasContext";
import { useChartsInteractive } from "../../contexts/chartContext";
import { useCanvasMark } from "../../hooks/useCanvasMark";
import { useSerie } from "../../hooks/useSerie";
/* Canvas Imports */
import {
	fillPathGradient,
	fillPathSolid,
	paintDots,
	paintTexts,
	strokePath,
} from "../../lib/canvas/paint";
/* Core Imports */
import {
	generateDataPaths,
	generateHorizontalDataPaths,
	generateNegativeDataPaths,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isTimeSerie } from "../../lib/utils";

export type LineProps = {
	name: string;
	hideLine?: boolean;
	showDots?: boolean;
	labelYOffset?: number;
	labelSize?: number;
	dashed?: boolean;
	trimZeros?: boolean;
	showLabels?: boolean;
	highlightLabels?: boolean;
	horizontal?: boolean;
	labelXOffset?: number;
	lineOffset?: number;
	tiltLabels?: boolean;
	tiltLabelsAngle?: number;
	fill?: string;
	fillOpacity?: number;
	// Riempie l'area sotto la linea con una sfumatura verticale dal colore
	// (fill ?? colore serie) a trasparente — effetto area-chart/sparkline.
	// Vale anche per i grafici negativi (area fino alla linea dello zero); non
	// per gli orizzontali.
	fillGradient?: boolean;
};

const Line = (props: LineProps) => {
	const {
		name,
		dashed = false,
		trimZeros = false,
		showDots = false,
		showLabels = false,
		highlightLabels = false,
		labelYOffset = 0,
		hideLine = false,
		labelSize = 12,
		horizontal = false,
		labelXOffset = 0,
		lineOffset = undefined,
		tiltLabels = false,
		tiltLabelsAngle = 45,
		fill = undefined,
		fillOpacity = 0,
		fillGradient = false,
	} = props;

	const interactive = useChartsInteractive();
	// id univoco e stabile per il <linearGradient> di questa linea (SSR-safe).
	const gradientId = `line-gradient-${useId()}`;

	const {
		ctx,
		theme,
		serie: serieElement,
	} = useSerie(name, isTimeSerie, {
		component: "Line",
		serieTypeLabel: "bar/line/bar-stacked/group-bar",
	});

	const { padding = defaultTheme.padding } = theme ?? {};

	const hoveredElement = interactive?.hoveredElement;
	const elements = ctx?.elements;

	// ctx (ChartStructuralContext) e' ora una reference stabile tra un
	// mousemove e l'altro (vedi C2): dipendere dall'intero ctx invece che dai
	// singoli campi e' sicuro e piu' semplice da mantenere corretto.
	const result = useMemo(() => {
		if (!ctx || !theme || !serieElement) return null;

		const pathsConfig = { ...ctx, padding };

		if (ctx.negative) {
			return generateNegativeDataPaths(
				serieElement,
				{ ...pathsConfig, trimZeros: Number(trimZeros) },
				"line",
			);
		}
		if (horizontal) {
			return generateHorizontalDataPaths(
				serieElement,
				{ ...pathsConfig, trimZeros, barOffset: lineOffset },
				"line",
			);
		}
		return generateDataPaths(
			serieElement,
			{ ...pathsConfig, trimZeros },
			"line",
		);
	}, [ctx, theme, serieElement, padding, trimZeros, horizontal, lineOffset]);

	// Derivazioni GUARDATE (sicure anche prima che i dati siano pronti): servono
	// sia al ramo SVG sia alla draw-op canvas, che va costruita PRIMA degli
	// early-return (regola degli hook).
	const { paths, dataPoints } = result ?? {};

	const linePath = paths?.filter((p) => p !== "").join() ?? "";

	const linePoints = dataPoints?.get(serieElement?.name ?? "") ?? [];

	const serieIndex =
		elements?.findIndex((el) => el.name === serieElement?.name) ?? -1;

	const serieColor =
		serieElement?.color ??
		theme?.seriesColors?.[serieIndex] ??
		theme?.seriesColors?.[0];

	const dotRadius = showDots ? 3 : 0;

	const labelYSpacing = padding / 2 + labelYOffset;
	const labelXSpacing = padding / 2 + labelXOffset;

	// Area sotto la linea (fill solido o fillGradient): un path "chiuso" dai punti
	// validi giu' fino alla baseline — chartYEnd nel caso normale, la linea dello
	// zero (chartYMiddle) nei grafici negativi (l'area va dal tratto allo zero,
	// gestendo i valori sia positivi che negativi). Non per horizontal. I punti
	// invalidi (sentinella [0,-10] dai valori nulli/trimZeros) hanno y < 0.
	const hasArea = (fill !== undefined || fillGradient) && !horizontal;
	const areaBaseline = ctx?.negative
		? (ctx?.chartYMiddle ?? ctx?.chartYEnd ?? 0)
		: (ctx?.chartYEnd ?? 0);
	const areaColor = fill ?? serieColor;
	const areaTopOpacity = fillOpacity || 0.3;
	const validAreaPoints = hasArea
		? (linePoints as [number, number][]).filter((p) => p[1] >= 0)
		: [];
	const areaPath =
		validAreaPoints.length > 1
			? `M ${validAreaPoints[0][0]} ${validAreaPoints[0][1]} ${validAreaPoints
					.slice(1)
					.map((p) => `L ${p[0]} ${p[1]}`)
					.join(
						" ",
					)} L ${validAreaPoints[validAreaPoints.length - 1][0]} ${areaBaseline} L ${validAreaPoints[0][0]} ${areaBaseline} Z`
			: "";

	// Dot: con showDots si disegnano tutti i punti; senza, SOLO quello sotto il
	// cursore. Prima si renderizzava un <circle> per ogni punto anche a showDots
	// off (r=0, invisibili) solo per far crescere a r=7 quello in hover: a 10k+
	// punti erano migliaia di nodi DOM inutili (fino al crash). L'aspetto e'
	// identico perche' i non-hover erano gia' invisibili.
	const validDotPoints = (linePoints as [number, number][]).filter(
		(el) => el.length > 0,
	);
	const hoveredDotIndex = hoveredElement?.elementIndex;
	const hoveredDotPoint =
		hoveredDotIndex != null ? validDotPoints[hoveredDotIndex] : undefined;

	// --- Canvas (increment 1): stessa geometria (linePath/areaPath/dot via
	// Path2D) disegnata su UN nodo. useCanvasMark e' NO-OP in modalita' SVG. ---
	const canvasLayer = useCanvasLayer();
	const isCanvas = !!canvasLayer;
	const areaYTop = validAreaPoints.length
		? Math.min(...validAreaPoints.map((p) => p[1]))
		: 0;
	const drawOp = useCallback<CanvasDrawOp>(
		(g) => {
			const color = serieColor ?? "#000";
			if (areaPath) {
				if (fillGradient) {
					fillPathGradient(
						g,
						areaPath,
						areaColor ?? color,
						areaTopOpacity,
						areaYTop,
						areaBaseline,
					);
				} else if (fill !== undefined) {
					fillPathSolid(g, areaPath, fill, fillOpacity);
				}
			}
			if (!hideLine) {
				strokePath(g, linePath, color, theme?.line?.size ?? 2);
				if (showDots) {
					paintDots(
						g,
						validDotPoints,
						color,
						dotRadius,
						hoveredDotIndex ?? -1,
						7,
					);
				} else if (hoveredDotPoint) {
					paintDots(g, [hoveredDotPoint], color, 7, 0, 7);
				}
			}
			// Label di valore (showLabels tutte, highlightLabels solo l'hover), come
			// i <text> SVG: allineamento e rotazione (tiltLabels) inclusi.
			if (showLabels || highlightLabels) {
				const align = horizontal || tiltLabels ? "start" : "center";
				// Rotazione solo nel caso verticale tiltato (come lo SVG).
				const rotate = !horizontal && tiltLabels ? tiltLabelsAngle : undefined;
				const items = (linePoints as [number, number][])
					.map((point, i) => {
						if (!showLabels && hoveredDotIndex !== i) return null;
						if (!point || point.length < 2) return null;
						const value = serieElement?.data?.[i]?.value;
						return {
							x: horizontal
								? point[0] + labelXSpacing
								: point[0] - labelXSpacing,
							y: horizontal ? point[1] : point[1] - labelYSpacing,
							text: serieElement?.format
								? String(serieElement.format(value as number))
								: value == null
									? ""
									: String(value),
							align: align as CanvasTextAlign,
							rotate,
						};
					})
					.filter((it): it is NonNullable<typeof it> => it !== null);
				paintTexts(g, items, color, labelSize);
			}
		},
		[
			serieColor,
			areaPath,
			fillGradient,
			areaColor,
			areaTopOpacity,
			areaYTop,
			areaBaseline,
			fill,
			fillOpacity,
			hideLine,
			linePath,
			theme?.line?.size,
			showDots,
			validDotPoints,
			dotRadius,
			hoveredDotIndex,
			hoveredDotPoint,
			showLabels,
			highlightLabels,
			linePoints,
			serieElement,
			labelSize,
			labelXSpacing,
			labelYSpacing,
			horizontal,
			tiltLabels,
			tiltLabelsAngle,
		],
	);
	useCanvasMark(isCanvas && result ? drawOp : null);

	if (!ctx || !theme || !elements || !serieElement || !result) return null;
	// Canvas-mode: nessun output SVG (le marche sono sul bitmap).
	if (isCanvas) return null;

	return (
		<>
			{areaPath && (
				<>
					{fillGradient && (
						<defs>
							<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor={areaColor}
									stopOpacity={areaTopOpacity}
								/>
								<stop offset="100%" stopColor={areaColor} stopOpacity={0} />
							</linearGradient>
						</defs>
					)}
					<path
						d={areaPath}
						fill={fillGradient ? `url(#${gradientId})` : fill}
						fillOpacity={fillGradient ? undefined : fillOpacity}
						stroke="none"
					/>
				</>
			)}
			{!hideLine && (
				<path
					strokeLinecap="round"
					strokeDasharray={dashed ? theme.threshold?.dash : 0}
					strokeLinejoin="round"
					d={linePath}
					strokeWidth={theme?.line?.size}
					stroke={serieColor}
					fill="none"
				/>
			)}
			{(showLabels || highlightLabels) &&
				linePoints.map(
					(point: [x: number, y: number], dataPointIndex: number) => {
						// In un grafico horizontal i punti sono incollati a righe fisse
						// vicine al bordo superiore del canvas: spostare la label sopra
						// il punto (come nel caso verticale) la farebbe uscire dal
						// canvas per la prima riga. La spostiamo di lato, verso destra.
						const labelX = horizontal
							? point[0] + labelXSpacing
							: point[0] - labelXSpacing;
						const labelY = horizontal ? point[1] : point[1] - labelYSpacing;

						return (
							<text
								key={`${serieElement.name}-label-${dataPointIndex}`}
								display={
									(highlightLabels &&
										hoveredElement?.elementIndex === dataPointIndex) ||
									showLabels
										? "block"
										: "none"
								}
								fontSize={labelSize}
								fontWeight="bold"
								fill={serieColor}
								x={labelX}
								y={labelY}
								textAnchor={horizontal || tiltLabels ? "start" : "middle"}
								transform={
									!horizontal && tiltLabels
										? `rotate(${tiltLabelsAngle}, ${labelX}, ${labelY})`
										: undefined
								}
							>
								{serieElement.format
									? serieElement.format(
											serieElement?.data?.[dataPointIndex]?.value,
										)
									: serieElement?.data?.[dataPointIndex]?.value}
							</text>
						);
					},
				)}
			{!hideLine &&
				showDots &&
				validDotPoints.map(
					(point: [x: number, y: number], dataPointIndex: number) => (
						<circle
							key={`${serieElement.name}-dot-${dataPointIndex}`}
							cx={point[0]}
							cy={point[1]}
							r={
								hoveredElement?.elementIndex === dataPointIndex ? 7 : dotRadius
							}
							fillOpacity={0.7}
							fill={serieColor}
							stroke={serieColor}
							strokeWidth={2}
						/>
					),
				)}
			{!hideLine && !showDots && hoveredDotPoint && (
				<circle
					key={`${serieElement.name}-dot-hover`}
					cx={hoveredDotPoint[0]}
					cy={hoveredDotPoint[1]}
					r={7}
					fillOpacity={0.7}
					fill={serieColor}
					stroke={serieColor}
					strokeWidth={2}
				/>
			)}
		</>
	);
};

export default Line;
