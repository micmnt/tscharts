/* Types Imports */

/* React Imports */
import { useMemo } from "react";
/* Hooks Imports */
import { useSerie } from "../../hooks/useSerie";
/* Core Imports */
import {
	generateGroupDataPaths,
	generateStackedGroupDataPaths,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isTimeSerie } from "../../lib/utils";
import { SerieValueLabels } from "../shared/SerieValueLabels";

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

	const {
		ctx,
		theme,
		serie: serieElement,
	} = useSerie(name, isTimeSerie, {
		component: "GroupBar",
		serieTypeLabel: "bar/line/bar-stacked/group-bar",
	});

	const { padding = defaultTheme.padding } = theme ?? {};

	const {
		radius = 0,
		topLeftRadius = 0,
		topRightRadius = 0,
		bottomRightRadius = 0,
		bottomLeftRadius = 0,
		labelSize = 12,
		topLabelSize = 12,
		labelColor = "white",
		topLabelColor = "black",
	} = config || {};

	// barWidth/barGroupGap sono config di layout condivisa: dalla v1.0 arrivano
	// da <Chart> attraverso globalConfig (M1), non piu' dal config della serie
	// (che resta accettato ma deprecato: computeGlobalConfig lo inoltra qui).
	const barWidth = ctx?.globalConfig?.barWidth ?? padding;
	const barGroupGap = ctx?.globalConfig?.barGroupGap ?? padding / 4;

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

	if (!ctx || !theme || !elements || !serieElement) return null;

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

export default GroupBar;
