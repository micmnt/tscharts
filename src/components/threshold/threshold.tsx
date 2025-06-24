/* Types Imports */

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";

/* Core Imports */
import {
	getSerieAssociatedThresholds,
	getTimeSerieMaxValue,
	getValuePosition,
} from "../../lib/core";
import { calculateFlatValue, isDefined } from "../../lib/utils";
import type { ChartState, ThemeState, TimeSerieEl } from "../../types";

type ThresholdProps = {
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
	const theme = useChartsTheme() as ThemeState;
	const ctx = useCharts() as ChartState;

	const {
		dashed = false,
		type = "horizontal",
		name,
		showLabel = false,
		size = theme.threshold?.size,
		axisName = "",
		dx = 0,
		dy = 0,
	} = props;

	const {
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		timeSeriesMaxValue,
		elements,
	} = ctx;

	const thresholdElement = elements?.find((el) => el.name === name);

	if (!thresholdElement) return null;

	const thresholdValue = thresholdElement.data as number;

	if (!isDefined(thresholdValue)) return null;

	const { padding } = theme;

	let serieMax = timeSeriesMaxValue as number;

	const referenceAxisSerie = elements?.find((el) => el.name === axisName);

	if (referenceAxisSerie && elements) {
		const otherThresholds = getSerieAssociatedThresholds(elements, axisName);
		serieMax = getTimeSerieMaxValue([
			...(referenceAxisSerie?.data as TimeSerieEl[]),
			...otherThresholds,
		]);
	}

	const chartYEnd = _chartYEnd as number;
	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;

	const flatMax = ctx.flatMax ? calculateFlatValue(serieMax) : serieMax;

	const position = getValuePosition(
		flatMax,
		thresholdValue,
		chartYEnd - padding,
	);

	const svgValue = chartYEnd - position;

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
