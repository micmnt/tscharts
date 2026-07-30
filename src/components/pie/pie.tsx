/* React Imports */
import { useMemo } from "react";
/* Context Imports */
import {
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";

/* Core Imports */
import { generatePiePaths } from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import type { PieSerieEl } from "../../types";

export type PieProps = {
	name: string;
};

const Pie = (props: PieProps) => {
	const { name } = props;

	const ctx = useChartsStructural();

	const theme = useChartsTheme();

	const { padding = defaultTheme.padding } = theme ?? {};

	const elements = ctx?.elements;

	const serieElement = elements?.find((el) => el.name === name);

	// ctx (ChartStructuralContext) e' ora una reference stabile tra un
	// mousemove e l'altro (vedi C2): dipendere dall'intero ctx invece che dai
	// singoli campi e' sicuro e piu' semplice da mantenere corretto.
	const result = useMemo(() => {
		if (!ctx || !theme || !serieElement) return null;
		return generatePiePaths(serieElement, { ...ctx, padding });
	}, [ctx, theme, serieElement, padding]);

	if (!ctx || !theme || !serieElement || !result) return null;

	const { paths, dataPoints } = result;

	const serieLabels = serieElement.labels ?? [];

	const serieData = serieElement.data as PieSerieEl[];

	const slicesColors = serieData.map(
		(el, elIndex) => el.color ?? theme.seriesColors?.[elIndex],
	);

	const slices = paths.map((path, pathIndex) => (
		<path
			d={path}
			fill={slicesColors[pathIndex]}
			key={`${serieElement.name}-slice-${pathIndex}`}
			shapeRendering="geometricPrecision"
		/>
	));
	const labels = serieLabels.map((label, labelIndex) => (
		<text
			textAnchor="middle"
			fontSize={14}
			fontWeight="bold"
			fill={"white"}
			key={`${label.name}-${labelIndex}`}
			x={dataPoints.get(label.name)?.x}
			y={dataPoints.get(label.name)?.y}
		>
			{label.value}
		</text>
	));

	return [...slices, ...labels];
};

export default Pie;
