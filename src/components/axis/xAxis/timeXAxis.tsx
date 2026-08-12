import { Fragment } from "react";
import {
	generateXAxis,
	getChartTimeScale,
	NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER,
	normalizeTime,
} from "../../../lib/core";
import type { TimeSerieEl } from "../../../types";
import type { XAxisProps } from "../axisProps";
import { useAxisBase } from "../useAxisBase";
import { AxisLine, AxisTitle, GridLine } from "./parts";

const TimeXAxis = (props: XAxisProps) => {
	const {
		name,
		showGrid = false,
		gridColor = undefined,
		labelSize = undefined,
		labelColor = undefined,
		titleSize = undefined,
		lineColor = undefined,
		showName = false,
		showLine = false,
		tiltLabels = true,
		labelXOffset = 0,
		labelYOffset = 0,
		tiltLabelsAngle = 45,
		showLabels = true,
		ticks = "data",
		tickFormat,
	} = props;

	const { ctx, theme } = useAxisBase();

	if (!ctx || !theme) return null;

	const { padding } = theme;
	const { chartXEnd, chartYEnd, elements } = ctx;

	const labelFontSize = labelSize ?? theme?.axis?.labelSize;
	const labelTextColor = labelColor ?? theme.axis?.labelColor;

	const xAxis = generateXAxis({ ...ctx, padding });
	const timeScale = getChartTimeScale({ ...ctx, padding });

	if (!timeScale) return null;

	const lineSerie = elements?.find((el) => el.type === "line");
	const lineData = (lineSerie?.data ?? []) as TimeSerieEl[];
	const byData = ticks === "data";

	const tickTimes = byData
		? lineData.map((d) => normalizeTime(d.date, ctx.parseDate))
		: timeScale.ticks(typeof ticks === "number" ? ticks : 6);

	const tickY = ctx.negative
		? chartYEnd + NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER * padding
		: chartYEnd + padding;

	return (
		<>
			{showLine ? (
				<AxisLine d={xAxis?.path} theme={theme} lineColor={lineColor} />
			) : null}
			{showLabels
				? tickTimes.map((time, tickIndex) => {
						const x = timeScale.position(time);
						const value = tickFormat
							? tickFormat(time)
							: byData
								? (lineData[tickIndex]?.date ?? String(time))
								: new Date(time).toLocaleDateString();
						return (
							<Fragment key={`time-tick-${time}-${tickIndex}`}>
								{showGrid ? (
									<GridLine
										d={`M ${x} ${chartYEnd + (padding * 1) / 3} V 0`}
										theme={theme}
										gridColor={gridColor}
									/>
								) : null}
								<text
									textAnchor={tiltLabels ? "start" : "middle"}
									x={x - labelXOffset}
									y={tickY - labelYOffset}
									fontSize={labelFontSize}
									fill={labelTextColor}
									transform={
										tiltLabels
											? `rotate(${tiltLabelsAngle}, ${x}, ${tickY})`
											: undefined
									}
								>
									{value}
								</text>
							</Fragment>
						);
					})
				: null}
			{showName ? (
				<AxisTitle
					x={chartXEnd / 2}
					y={chartYEnd + 45}
					name={name}
					titleSize={titleSize}
					theme={theme}
				/>
			) : null}
		</>
	);
};

export default TimeXAxis;
