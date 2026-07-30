/* Types Imports */

/* Context Imports */
import {
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";

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

// Moltiplicatore di `padding` per lo spazio riservato sotto lo zero nei
// grafici con valori negativi, applicato al posizionamento delle soglie.
// Stesso concetto di NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER (core.ts) ma
// con un valore diverso (3.1 invece di 3.5): discrepanza preesistente nel
// codice originale, non uniformata qui per non introdurre un cambio di
// comportamento non richiesto.
const NEGATIVE_THRESHOLD_Y_OFFSET_MULTIPLIER = 3.1;

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
	const theme = useChartsTheme();
	const ctx = useChartsStructural();

	const { padding = defaultTheme.padding } = theme ?? {};

	const {
		dashed = false,
		type = "horizontal",
		name,
		showLabel = false,
		size = theme?.threshold?.size,
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
	} = ctx ?? {};

	const foundThresholdElement = elements?.find((el) => el.name === name);
	const thresholdElement =
		foundThresholdElement && isThresholdSerie(foundThresholdElement)
			? foundThresholdElement
			: undefined;

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

	const chartDimension = ctx.negative
		? zeroY - NEGATIVE_THRESHOLD_Y_OFFSET_MULTIPLIER * padding
		: chartYEnd - padding;

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
