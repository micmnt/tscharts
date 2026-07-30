/* React Imports */
import { useMemo } from "react";
/* Contezt Imports */
import {
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
import { generateDonutPaths } from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isDefined } from "../../lib/utils";
import type { PieSerieEl } from "../../types";

export type DonutProps = {
	name: string;
	config?: {
		innerRadius?: number;
		centerElement?: {
			value?: string;
			valueColor?: string;
			valueSize?: number;
			uom?: string;
			uomColor?: string;
			uomSize?: number;
			uomDx?: number;
			label?: string;
			labelColor?: string;
			labelSize?: number;
			labelDy?: number;
		};
	};
};

const Donut = (props: DonutProps) => {
	const { name, config } = props;

	const { innerRadius, centerElement } = config ?? {};

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
		return generateDonutPaths(serieElement, {
			...ctx,
			padding,
			innerRadius,
			centerElement,
		});
	}, [ctx, theme, serieElement, padding, innerRadius, centerElement]);

	if (!ctx || !theme || !serieElement || !result) return null;

	const { paths, dataPoints, centerPoint } = result;

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

	if (centerPoint && isDefined(centerElement?.value)) {
		const centerTextValue = (
			<text
				key="donut-center-value"
				textAnchor="middle"
				fontSize={centerElement?.valueSize ?? 30}
				fontWeight="bold"
				fill={centerElement?.valueColor ?? "white"}
				x={centerPoint.x}
				y={centerPoint.y}
			>
				{centerElement?.value}
				<tspan
					dx={centerElement?.uomDx ?? 0}
					fontSize={centerElement?.uomSize ?? 30}
					fill={centerElement?.uomColor ?? "white"}
				>
					{centerElement?.uom}
				</tspan>
			</text>
		);
		const centerTextLabel = (
			<text
				key="donut-center-label"
				dy={centerElement?.labelDy ?? 0}
				textAnchor="middle"
				fontSize={centerElement?.labelSize ?? 20}
				fill={centerElement?.labelColor ?? "white"}
				x={centerPoint.x}
				y={centerPoint.y + (centerElement?.valueSize ?? 30) / 2}
			>
				{centerElement?.label}
			</text>
		);
		return [...slices, centerTextValue, centerTextLabel, ...labels];
	}

	return [...slices, ...labels];
};

export default Donut;
