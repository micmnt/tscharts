import { type ReactNode, useMemo } from "react";
import { useSerie } from "../../hooks/useSerie";
import { generateAngleDonutPaths } from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import { isAngleDonutSerie, isDefined } from "../../lib/utils";
import type { AngleDonutSerieEl } from "../../types";

export type AngleDonutProps = {
	name: string;
	config?: {
		innerRadius?: number;
		angle?: number;
		showTrack?: boolean;
		customLabel?: ((el: AngleDonutSerieEl) => ReactNode) | string;
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

	const {
		innerRadius,
		centerElement,
		angle,
		showTrack,
		customLabel = undefined,
	} = config ?? {};

	const {
		ctx,
		theme,
		serie: serieElement,
	} = useSerie(name, isAngleDonutSerie, {
		component: "AngleDonut",
		serieTypeLabel: "angle-donut",
	});

	const { padding = defaultTheme.padding } = theme ?? {};

	// ctx (ChartStructuralContext) e' ora una reference stabile tra un
	// mousemove e l'altro (vedi C2): dipendere dall'intero ctx invece che dai
	// singoli campi e' sicuro e piu' semplice da mantenere corretto.
	const result = useMemo(() => {
		if (!ctx || !theme || !serieElement) return null;
		return generateAngleDonutPaths(serieElement, {
			...ctx,
			padding,
			innerRadius,
			centerElement,
			angle,
			showTrack,
		});
	}, [
		ctx,
		theme,
		serieElement,
		padding,
		innerRadius,
		centerElement,
		angle,
		showTrack,
	]);

	if (!ctx || !theme || !serieElement) return null;

	if (!result) return null;

	const { paths, centerPoint } = result;
	const serieData = serieElement.data;

	const slicesColors = serieData.map(
		(el, elIndex) => el.color ?? theme.seriesColors?.[elIndex],
	);

	const shadowSlicesColors = serieData.map(
		(el, elIndex) => el.trackColor ?? theme.seriesColors?.[elIndex],
	);

	const shadowPaths = paths
		.map((el) => el.shadowPath)
		?.filter((el) => el !== "");
	const normalPaths = paths.map((el) => el.path);

	const slices = normalPaths.map((path, pathIndex) => (
		<path
			d={path}
			fill={slicesColors[pathIndex]}
			key={`${serieElement.name}-slice-${pathIndex}`}
			shapeRendering="geometricPrecision"
		/>
	));

	const shadowSlices = shadowPaths.map((path, pathIndex) => (
		<path
			d={path}
			fill={shadowSlicesColors[pathIndex]}
			fillOpacity={0.2}
			key={`${serieElement.name}-shadow-${pathIndex}`}
			shapeRendering="geometricPrecision"
		/>
	));

	const returnValues = [...shadowSlices, ...slices];

	if (customLabel && isDefined(customLabel as string)) {
		// Un foreignObject per anello, ancorato alla geometria reale di
		// QUEL ring (paths[i].labelElement) - non un container unico
		// condiviso da tutti gli anelli, che per anelli sottili finirebbe
		// scollegato dal ring che dovrebbe descrivere.
		const labels = serieData.map((serieEl, serieElIndex) => {
			const ringLabelElement = paths[serieElIndex]?.labelElement;

			if (!ringLabelElement) return null;

			const content =
				typeof customLabel === "string" ? customLabel : customLabel?.(serieEl);

			return (
				<foreignObject
					key={`${serieElement.name}-custom-label-${serieElIndex}`}
					x={ringLabelElement.x}
					y={ringLabelElement.y}
					width={ringLabelElement.width}
					height={ringLabelElement.height}
				>
					{content}
				</foreignObject>
			);
		});

		returnValues.push(...labels.filter((label) => label !== null));
	}

	if (centerPoint && isDefined(centerElement?.value)) {
		const centerTextValue = (
			<text
				key="angle-donut-center-value"
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
				key="angle-donut-center-label"
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

		returnValues.push(centerTextValue);
		returnValues.push(centerTextLabel);
	}

	return returnValues;
};

export default AngleDonut;
