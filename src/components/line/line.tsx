/* Types Imports */

import { useMemo } from "react";
import {
	useChartsInteractive,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
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
	higlightLabels?: boolean;
	horizontal?: boolean;
	labelXOffset?: number;
	lineOffset?: number;
	tiltLabels?: boolean;
	tiltLabelsAngle?: number;
	fill?: string;
	fillOpacity?: number;
};

const Line = (props: LineProps) => {
	const {
		name,
		dashed = false,
		trimZeros = false,
		showDots = false,
		showLabels = false,
		higlightLabels = false,
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
	} = props;

	const ctx = useChartsStructural();
	const interactive = useChartsInteractive();

	const theme = useChartsTheme();

	const { padding = defaultTheme.padding } = theme ?? {};

	const hoveredElement = interactive?.hoveredElement;
	const elements = ctx?.elements;

	const foundSerieElement = elements?.find((el) => el.name === name);
	const serieElement =
		foundSerieElement && isTimeSerie(foundSerieElement)
			? foundSerieElement
			: undefined;

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

	if (!ctx || !theme || !elements || !serieElement || !result) return null;

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

	return (
		<>
			{!hideLine && (
				<path
					strokeLinecap="round"
					strokeDasharray={dashed ? theme.threshold?.dash : 0}
					strokeLinejoin="round"
					d={linePath}
					strokeWidth={theme?.line?.size}
					stroke={serieColor}
					fill={fill}
					fillOpacity={fillOpacity}
				/>
			)}
			{(showLabels || higlightLabels) &&
				linePoints.map(
					(point: [x: number, y: number], dataPointIndex: number) => {
						const labelX = point[0] - labelXSpacing;
						const labelY = point[1] - labelYSpacing;

						return (
							<text
								key={`${serieElement.name}-label-${dataPointIndex}`}
								display={
									(higlightLabels &&
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
								textAnchor={tiltLabels ? "start" : "middle"}
								transform={
									tiltLabels
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
