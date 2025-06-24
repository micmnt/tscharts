/* Types Imports */

import { nanoid } from "nanoid";
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
/* Core Imports */
import { generateDataPaths, generateHorizontalDataPaths } from "../../lib/core";
import type { TimeSerieEl } from "../../types";

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
	} = props;

	const ctx = useCharts();

	const theme = useChartsTheme();

	if (!ctx || !theme) return null;

	const { hoveredElement, elements } = ctx;

	const { padding } = theme;

	if (!elements) return null;

	const serieElement = elements.find((el) => el.name === name);

	if (!serieElement) return null;

	const { paths, dataPoints } = horizontal
		? (generateHorizontalDataPaths(
				serieElement,
				{ ...ctx, padding, trimZeros, barOffset: lineOffset },
				"line",
			) ?? {})
		: (generateDataPaths(
				serieElement,
				{ ...ctx, padding, trimZeros },
				"line",
			) ?? {});

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
					fill="none"
					stroke={serieColor}
				/>
			)}
			{(showLabels || higlightLabels) &&
				linePoints.map(
					(point: [x: number, y: number], dataPointIndex: number) => {
						const labelX = point[0] - labelXSpacing;
						const labelY = point[1] - labelYSpacing;

						return (
							<text
								key={`${serieElement.name}-${point[0]}-${point[1]}-${nanoid()}`}
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
											(serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
												?.value,
										)
									: (serieElement?.data as TimeSerieEl[])?.[dataPointIndex]
											?.value}
							</text>
						);
					},
				)}
			{!hideLine &&
				linePoints
					.filter((el: [x: number, y: number]) => el.length > 0)
					.map((point: [x: number, y: number], dataPointIndex: number) => (
						<circle
							key={`${serieElement.name}-${point[0]}-${point[1]}-${nanoid()}`}
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
