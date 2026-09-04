import { useMemo } from "react";

import { useSerie } from "../../hooks/useSerie";

import {
	generateGroupDataPaths,
	generateStackedGroupDataPaths,
	resolveBarWidth,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isTimeSerie, warnDev } from "../../lib/utils";
import { SerieValueLabels } from "../shared/SerieValueLabels";

export type GroupBarProps = {
	name: string;
	stacked?: boolean;
	showLabels?: boolean;
	topLabelSerie?: string;

	radius?: number;
	topLeftRadius?: number;
	topRightRadius?: number;
	bottomRightRadius?: number;
	bottomLeftRadius?: number;
	labelSize?: number;
	labelColor?: string;
	topLabelSize?: number;
	topLabelColor?: string;
};

const GroupBar = (props: GroupBarProps) => {
	const {
		name,
		showLabels = false,
		topLabelSerie = "",
		stacked = false,
	} = props;

	const { ctx, theme, serie: serieElement } = useSerie(name, isTimeSerie);

	const { padding = defaultTheme.padding } = theme ?? {};

	const radius = props.radius ?? 0;
	const topLeftRadius = props.topLeftRadius ?? 0;
	const topRightRadius = props.topRightRadius ?? 0;
	const bottomRightRadius = props.bottomRightRadius ?? 0;
	const bottomLeftRadius = props.bottomLeftRadius ?? 0;
	const labelSize = props.labelSize ?? 12;
	const topLabelSize = props.topLabelSize ?? 12;
	const labelColor = props.labelColor ?? "white";
	const topLabelColor = props.topLabelColor ?? "black";

	const barWidth = ctx ? resolveBarWidth(ctx, padding) : padding;
	const barGroupGap = ctx?.globalConfig?.barGroupGap ?? padding / 4;

	const elements = ctx?.elements;

	const foundTopLabelSerieElement = elements?.find(
		(el) => el.name === topLabelSerie,
	);
	const topLabelSerieElement =
		foundTopLabelSerieElement && isTimeSerie(foundTopLabelSerieElement)
			? foundTopLabelSerieElement
			: undefined;

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
	if (!serieElement) {
		warnDev(
			`<GroupBar name="${name}" />: nessuna serie di tipo bar/line/bar-stacked/group-bar trovata con questo name.`,
		);
		return null;
	}
	if (!elements) return null;

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
