import { nanoid } from "nanoid";
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
import { generateAngleDonutPaths } from "../../lib/core";
import { isDefined } from "../../lib/utils";
import { AngleDonutSerieEl } from "../../types";
import { Fragment, ReactNode } from "react";

export type AngleDonutProps = {
	name: string;
	config?: {
		innerRadius?: number;
    angle?: number;
    showTrack?: boolean;
		customLabel?: ((el: AngleDonutSerieEl) => ReactNode) | string
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

const AngleDonut = (props: AngleDonutProps) => {
  const { name, config } = props;

  const { innerRadius, centerElement, angle, showTrack, customLabel = undefined } = config ?? {};

  const ctx = useCharts();

	const theme = useChartsTheme();

	if (!ctx || !theme) return null;

	const { elements } = ctx;

	const { padding } = theme;

	if (!elements) return null;

	const serieElement = elements.find((el) => el.name === name);
	
	if (!serieElement) return null;
	
	const { paths, centerPoint, labelElement } = generateAngleDonutPaths(serieElement, {
		...ctx,
		padding,
		innerRadius,
		centerElement,
		angle,
		showTrack
	});
	const serieData = serieElement.data as AngleDonutSerieEl[];

	const slicesColors = serieData.map(
		(el, elIndex) => el.color ?? theme.seriesColors?.[elIndex],
	);

	const shadowSlicesColors = serieData.map(
		(el, elIndex) => el.trackColor ?? theme.seriesColors?.[elIndex],
	);

	const shadowPaths = paths.map(el => el.shadowPath)?.filter(el => el !== '')
	const normalPaths = paths.map(el => el.path)
	
	const slices = normalPaths.map((path, pathIndex) => (
		<path
			d={path}
			fill={slicesColors[pathIndex]}
			key={`${path}-${nanoid()}`}
			shapeRendering="geometricPrecision"
		/>
	));

	const shadowSlices = shadowPaths.map((path, pathIndex) => (
		<path
			d={path}
			fill={shadowSlicesColors[pathIndex]}
			fillOpacity={0.2}
			key={`${path}-${nanoid()}`}
			shapeRendering="geometricPrecision"
		/>
	))

	const returnValues = [...shadowSlices, ...slices]

	if(customLabel && isDefined(customLabel as string)) {
	const labels = serieData.map(serieEl => {
		if(typeof customLabel === 'string') {
			return <Fragment key={`customDonutLabel-${nanoid()}`}>{customLabel}</Fragment>
		}

		return <Fragment key={`customDonutLabel-${nanoid()}`}>{customLabel?.(serieEl)}</Fragment>
	})
	
	const labelContainer = (
		<foreignObject
			key={`labelValue-${nanoid()}`}
			x={labelElement.x}
			y={labelElement.y}
			width={labelElement.width}
			height={labelElement.height}
			>
				{labels}
			</foreignObject>
			)

		returnValues.push(labelContainer)
	}

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

		returnValues.push(centerTextValue)
		returnValues.push(centerTextLabel)
	}
	

  return returnValues;
}

export default AngleDonut