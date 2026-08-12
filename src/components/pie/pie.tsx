import { useMemo } from "react";
import { useSerie } from "../../hooks/useSerie";

import { generatePiePaths } from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isPieSerie } from "../../lib/utils";

export type PieProps = {
	name: string;
};

const Pie = (props: PieProps) => {
	const { name } = props;

	const {
		ctx,
		theme,
		serie: serieElement,
	} = useSerie(name, isPieSerie, {
		component: "Pie",
		serieTypeLabel: "pie",
	});

	const { padding = defaultTheme.padding } = theme ?? {};

	const result = useMemo(() => {
		if (!ctx || !theme || !serieElement) return null;
		return generatePiePaths(serieElement, { ...ctx, padding });
	}, [ctx, theme, serieElement, padding]);

	if (!ctx || !theme || !serieElement) return null;

	if (!result) return null;

	const { paths, dataPoints } = result;

	const serieLabels = serieElement.labels ?? [];

	const serieData = serieElement.data;

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
