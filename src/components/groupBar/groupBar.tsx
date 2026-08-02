/* Types Imports */

/* React Imports */
import { useMemo } from "react";
/* Context Imports */
import {
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
/* Core Imports */
import {
	generateGroupDataPaths,
	generateStackedGroupDataPaths,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isTimeSerie, warnDev } from "../../lib/utils";

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
		barGroupGap?: number;
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

	const ctx = useChartsStructural();

	const theme = useChartsTheme();

	const { padding = defaultTheme.padding } = theme ?? {};

	const {
		radius = 0,
		topLeftRadius = 0,
		topRightRadius = 0,
		bottomRightRadius = 0,
		bottomLeftRadius = 0,
		barWidth = padding,
		barGroupGap = padding / 4,
		labelSize = 12,
		topLabelSize = 12,
		labelColor = "white",
		topLabelColor = "black",
	} = config || {};

	const elements = ctx?.elements;

	const foundSerieElement = elements?.find((el) => el.name === name);
	const serieElement =
		foundSerieElement && isTimeSerie(foundSerieElement)
			? foundSerieElement
			: undefined;

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
			barGroupGap,
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
		ctx,
		theme,
		serieElement,
		padding,
		barWidth,
		barGroupGap,
		radius,
		topLeftRadius,
		topRightRadius,
		bottomLeftRadius,
		bottomRightRadius,
		stacked,
	]);

	if (!ctx || !theme) {
		warnDev(
			`<GroupBar name="${name}" /> deve essere renderizzato dentro <Chart>.`,
		);
		return null;
	}

	if (!elements || !serieElement) {
		warnDev(
			`<GroupBar name="${name}" />: nessuna serie di tipo bar/line/bar-stacked/group-bar trovata con questo name.`,
		);
		return null;
	}

	if (!result) return null;

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
											topLabelSerieElement?.data?.[dataPointIndex]?.value,
										)
									: topLabelSerieElement?.data?.[dataPointIndex]?.value}
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
											serieElement?.data?.[dataPointIndex]?.value,
										)
									: serieElement?.data?.[dataPointIndex]?.value}
							</text>
						) : null,
					)
					.filter((el: [x: number, y: number]) => el !== null)}
		</>
	);
};

export default GroupBar;
