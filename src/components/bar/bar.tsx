/* Types Imports */
import type { ThemeState, TimeSerieEl } from "../../types";

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";

import { nanoid } from "nanoid";
/* Core Imports */
import { generateDataPaths, generateStackedDataPaths } from "../../lib/core";

export type BarProps = {
	name: string;
	stacked?: boolean;
	showLabels?: boolean;
	topLabelSerie?: string;
	config?: {
		selectedColor?: string;
		selectedValue?: string;
		barClickAction?: (value: unknown) => void;
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

const Bar = (props: BarProps) => {
	const {
		name,
		config,
		stacked = false,
		showLabels = false,
		topLabelSerie = "",
	} = props;

	const ctx = useCharts();

	const theme = useChartsTheme() as ThemeState;

	if (!ctx || !theme) return null;

	const { elements } = ctx;

	const { padding } = theme;

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

	const serieElement = elements?.find((el) => el.name === name);

	const topLabelSerieElement = elements?.find(
		(el) => el.name === topLabelSerie,
	);

	if (!serieElement) return null;

	const { paths, dataPoints, topLabelsPoints } = stacked
		? (generateStackedDataPaths(serieElement, {
				...ctx,
				padding,
				barWidth,
				radius,
				topLeftRadius,
				topRightRadius,
				bottomRightRadius,
				bottomLeftRadius,
			}) ?? {})
		: (generateDataPaths(
				serieElement,
				{
					...ctx,
					padding,
					barWidth,
					radius,
					topLeftRadius,
					topRightRadius,
					bottomRightRadius,
					bottomLeftRadius,
				},
				"bar",
			) ?? {});

	const serieIndex = elements?.findIndex((el) => el.name === serieElement.name);

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
				.map((p) => (
					<path key={`${p}-${nanoid()}`} d={p} fill={serieColor} />
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
								key={`${serieElement.name}-${point[0]}-${point[1]}-${nanoid()}`}
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
								key={`${serieElement.name}-${point[0]}-${point[1]}-${nanoid()}`}
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

export default Bar;
