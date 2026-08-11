/* Types Imports */

import { useId, useMemo } from "react";
import { useChartsInteractive } from "../../contexts/chartContext";
import { useSerie } from "../../hooks/useSerie";
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

	if (!ctx || !theme || !elements || !serieElement) return null;

	if (!result) return null;

	const { paths, dataPoints } = result;

	const linePath = paths?.filter((p) => p !== "").join() ?? "";

	const linePoints = dataPoints?.get(serieElement.name) ?? [];

	const serieIndex = elements.findIndex((el) => el.name === serieElement.name);

	const serieColor =
		serieElement.color ??
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
	const areaBaseline = ctx.negative
		? (ctx.chartYMiddle ?? ctx.chartYEnd)
		: ctx.chartYEnd;
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
				linePoints
					.filter((el: [x: number, y: number]) => el.length > 0)
					.map((point: [x: number, y: number], dataPointIndex: number) => (
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
					))}
		</>
	);
};

export default Line;
