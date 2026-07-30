/* React Imports */
import { useMemo } from "react";
/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";

/* Core Imports */
import { generatePiePaths } from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import type { PieSerieEl } from "../../types";

export type PieProps = {
	name: string;
};

const Pie = (props: PieProps) => {
	const { name } = props;

	const ctx = useCharts();

	const theme = useChartsTheme();

	const { padding = defaultTheme.padding } = theme ?? {};

	const elements = ctx?.elements;

	const serieElement = elements?.find((el) => el.name === name);

	// Campi di ctx usati dal calcolo dei path: width/height/padding, non
	// ctx intero (che cambia ad ogni mousemove, vanificando il memo).
	const { width, height } = ctx ?? {};

	const result = useMemo(() => {
		if (!theme || !serieElement) return null;
		return generatePiePaths(serieElement, { width, height, padding });
	}, [theme, serieElement, width, height, padding]);

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
