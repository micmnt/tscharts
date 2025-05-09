/* Contezt Imports */
import { nanoid } from "nanoid";
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
import { generateDonutPaths } from "../../lib/core";
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

	const ctx = useCharts();

	const theme = useChartsTheme();

	if (!ctx || !theme) return null;

	const { elements } = ctx;

	const { padding } = theme;

	if (!elements) return null;

	const serieElement = elements.find((el) => el.name === name);

	if (!serieElement) return null;

	const { paths, dataPoints, centerPoint } = generateDonutPaths(serieElement, {
		...ctx,
		padding,
		innerRadius,
		centerElement,
	});

	const serieLabels = serieElement.labels ?? [];

	const serieData = serieElement.data as PieSerieEl[];

	const slicesColors = serieData.map(
		(el, elIndex) => el.color ?? theme.seriesColors?.[elIndex],
	);

	const slices = paths.map((path, pathIndex) => (
		<path
			d={path}
			fill={slicesColors[pathIndex]}
			key={`${path}-${nanoid()}`}
			shapeRendering="geometricPrecision"
		/>
	));

	const labels = serieLabels.map((label) => (
		<text
			textAnchor="middle"
			fontSize={14}
			fontWeight="bold"
			fill={"white"}
			key={`${label.name}-${nanoid()}`}
			x={dataPoints.get(label.name)?.x}
			y={dataPoints.get(label.name)?.y}
		>
			{label.value}
		</text>
	));

	if (centerPoint && isDefined(centerElement?.value)) {
		const centerTextValue = (
			<text
        key={`centerTextValue-${nanoid()}`}
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
        key={`centerTextLabel-${nanoid()}`}
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
