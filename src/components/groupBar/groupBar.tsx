/* Types Imports */

/* React Imports */
import { useMemo } from "react";
/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
/* Core Imports */
import {
	generateGroupDataPaths,
	generateStackedGroupDataPaths,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import type { TimeSerieEl } from "../../types";

export type GroupBarProps = {
	name: string;
	stacked?: boolean;
	showLabels?: boolean;
	topLabelSerie?: string;
	config?: {
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
	};
};

const GroupBar = (props: GroupBarProps) => {
	const {
		config,
		name,
		showLabels = false,
		topLabelSerie = "",
		stacked = false,
	} = props;

	const ctx = useCharts();

	const theme = useChartsTheme();

	const { padding = defaultTheme.padding } = theme ?? {};

	const {
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
	} = config || {};

	const elements = ctx?.elements;

	const serieElement = elements?.find((el) => el.name === name);

	const topLabelSerieElement = elements?.find(
		(el) => el.name === topLabelSerie,
	);

	// Campi di ctx usati dal calcolo dei path: solo questi in dipendenza,
	// non ctx intero (che cambia ad ogni mousemove, vanificando il memo).
	const { chartXStart, chartXEnd, chartYEnd, chartYMiddle, globalConfig } =
		ctx ?? {};

	const result = useMemo(() => {
		if (!theme || !serieElement) return null;

		const pathsConfig = {
			elements,
			chartXStart,
			chartXEnd,
			chartYEnd,
			chartYMiddle,
			globalConfig,
			padding,
			barWidth,
			radius,
			topLeftRadius,
			topRightRadius,
			bottomLeftRadius,
			bottomRightRadius,
		};

		return stacked
			? generateStackedGroupDataPaths(serieElement, pathsConfig)
			: generateGroupDataPaths(serieElement, pathsConfig);
	}, [
		theme,
		serieElement,
		elements,
		chartXStart,
		chartXEnd,
		chartYEnd,
		chartYMiddle,
		globalConfig,
		padding,
		barWidth,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomLeftRadius,
		bottomRightRadius,
		stacked,
	]);

	if (!ctx || !theme || !elements || !serieElement || !result) return null;

	const { paths, dataPoints, topLabelsPoints } = result;

	const serieIndex = elements.findIndex((el) => el.name === serieElement.name);

	const serieColor =
		serieElement.color ??
		theme.seriesColors?.[serieIndex ?? 0] ??
		theme.seriesColors?.[0];

	const barPoints = dataPoints?.get(serieElement.name) ?? [];
	const labelsPoints = topLabelsPoints?.get(serieElement.name) ?? [];

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

export default GroupBar;
