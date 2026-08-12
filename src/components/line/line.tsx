import { Fragment, type ReactNode, useCallback, useId, useMemo } from "react";
import {
	type CanvasDrawOp,
	useCanvasLayer,
} from "../../contexts/canvasContext";
import { useChartsInteractive } from "../../contexts/chartContext";
import { useCanvasMark } from "../../hooks/useCanvasMark";
import { useSerie } from "../../hooks/useSerie";

import {
	fillPathGradient,
	fillPathSolid,
	paintDots,
	paintTexts,
	strokePath,
} from "../../lib/canvas/paint";

import {
	generateDataPaths,
	generateHorizontalDataPaths,
	generateNegativeDataPaths,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isTimeSerie, warnDev } from "../../lib/utils";

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

	fillGradient?: boolean;
	renderDot?: (props: LineDotProps) => ReactNode;
};

export type LineDotProps = {
	x: number;
	y: number;
	index: number;
	value: number;
	hovered: boolean;
	color: string;
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
		renderDot,
	} = props;

	const interactive = useChartsInteractive();

	const gradientId = `line-gradient-${useId()}`;

	const { ctx, theme, serie: serieElement } = useSerie(name, isTimeSerie);

	const { padding = defaultTheme.padding } = theme ?? {};

	const hoveredElement = interactive?.hoveredElement;
	const elements = ctx?.elements;

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

	const validDotPoints = (linePoints as [number, number][]).filter(
		(el) => el.length > 0,
	);
	const hoveredDotIndex = hoveredElement?.elementIndex;
	const hoveredDotPoint =
		hoveredDotIndex != null ? validDotPoints[hoveredDotIndex] : undefined;

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
			if (showLabels || highlightLabels) {
				const align = horizontal || tiltLabels ? "start" : "center";

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

	if (!ctx || !theme) {
		warnDev(`<Line name="${name}" /> deve essere renderizzato dentro <Chart>.`);
		return null;
	}
	if (!serieElement) {
		warnDev(
			`<Line name="${name}" />: nessuna serie di tipo bar/line/bar-stacked/group-bar trovata con questo name.`,
		);
		return null;
	}
	if (!elements || !result) return null;
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
					(point: [x: number, y: number], dataPointIndex: number) => {
						const hovered = hoveredElement?.elementIndex === dataPointIndex;
						if (renderDot) {
							return (
								<Fragment key={`${serieElement.name}-dot-${dataPointIndex}`}>
									{renderDot({
										x: point[0],
										y: point[1],
										index: dataPointIndex,
										value: serieElement.data[dataPointIndex]?.value ?? 0,
										hovered,
										color: serieColor ?? "#000",
									})}
								</Fragment>
							);
						}
						return (
							<circle
								key={`${serieElement.name}-dot-${dataPointIndex}`}
								cx={point[0]}
								cy={point[1]}
								r={hovered ? 7 : dotRadius}
								fillOpacity={0.7}
								fill={serieColor}
								stroke={serieColor}
								strokeWidth={2}
							/>
						);
					},
				)}
			{!hideLine &&
				!showDots &&
				hoveredDotPoint &&
				(renderDot ? (
					renderDot({
						x: hoveredDotPoint[0],
						y: hoveredDotPoint[1],
						index: hoveredDotIndex ?? -1,
						value: serieElement.data[hoveredDotIndex ?? -1]?.value ?? 0,
						hovered: true,
						color: serieColor ?? "#000",
					})
				) : (
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
				))}
		</>
	);
};

export default Line;
