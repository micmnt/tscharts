/* Types Imports */

/* Hooks Imports */
import { useSerie } from "../../hooks/useSerie";

/* Core Imports */
import {
	getSerieAssociatedThresholds,
	getTimeSerieMaxValue,
	getValuePosition,
} from "../../lib/core";
import defaultTheme from "../../lib/defaultTheme";
import {
	calculateFlatValue,
	isDefined,
	isThresholdSerie,
	isTimeSerie,
} from "../../lib/utils";

export type ThresholdProps = {
	name: string;
	axisName?: string;
	dashed?: boolean;
	type?: "vertical" | "horizontal";
	size?: number;
	showLabel?: boolean;
	dx?: number;
	dy?: number;
};
const Threshold = (props: ThresholdProps) => {
	const {
		dashed = false,
		type = "horizontal",
		name,
		showLabel = false,
		axisName = "",
		dx = 0,
		dy = 0,
	} = props;

	const {
		ctx,
		theme,
		serie: thresholdElement,
	} = useSerie(name, isThresholdSerie, {
		component: "Threshold",
		serieTypeLabel: "threshold",
	});

	const { padding = defaultTheme.padding } = theme ?? {};

	const size = props.size ?? theme?.threshold?.size;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		timeSeriesMaxValue,
		elements,
	} = ctx ?? {};

	if (!ctx || !theme || !thresholdElement) return null;

	const thresholdValue = thresholdElement.data;

	if (!isDefined(thresholdValue)) return null;

	let serieMax = timeSeriesMaxValue as number;

	const foundReferenceAxisSerie = elements?.find((el) => el.name === axisName);
	const referenceAxisSerie =
		foundReferenceAxisSerie && isTimeSerie(foundReferenceAxisSerie)
			? foundReferenceAxisSerie
			: undefined;

	if (referenceAxisSerie && elements) {
		const otherThresholds = getSerieAssociatedThresholds(elements, axisName);
		serieMax = getTimeSerieMaxValue([
			...referenceAxisSerie.data,
			...otherThresholds,
		]);
	}

	const chartYEnd = _chartYEnd as number;
	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;

	const flatMax = ctx.flatMax ? calculateFlatValue(serieMax) : serieMax;

	const zeroY = ctx.negative ? (ctx.chartYMiddle ?? 0) : chartYEnd;

	// Stessa definizione di halfHeight usata in generateNegativeDataPaths e
	// generateYAxis (core.ts): garantisce che la soglia si allinei sempre a
	// barre/linee/gridline dello stesso valore.
	const chartDimension = ctx.negative ? zeroY - padding : chartYEnd - padding;

	const isNegative = thresholdValue < 0;

	const position = getValuePosition(flatMax, thresholdValue, chartDimension);

	let svgValue = chartYEnd - position;

	if (ctx.negative) {
		svgValue = isNegative ? zeroY + position : zeroY - position;
	}

	const textY =
		svgValue < chartYEnd / 2 - padding
			? svgValue - padding / 2
			: svgValue + padding / 2;

	const path =
		type === "vertical"
			? `M ${svgValue} ${chartYEnd} V ${0}`
			: `M ${chartXStart + padding / 2} ${svgValue} H ${chartXEnd}`;

	return (
		<>
			<path
				d={path}
				strokeDasharray={dashed ? theme.threshold?.dash : 0}
				strokeLinecap="round"
				strokeWidth={size}
				stroke={thresholdElement.color ?? theme.seriesColors?.[1]}
			/>
			{showLabel && (
				<text
					dx={dx}
					dy={dy}
					textAnchor="end"
					x={chartXEnd - padding}
					y={textY}
					fontSize={theme.threshold?.textSize}
					fontWeight={600}
					fill={thresholdElement.color}
				>
					{thresholdElement.format
						? thresholdElement.format(thresholdValue)
						: thresholdValue}
				</text>
			)}
		</>
	);
};

export default Threshold;
