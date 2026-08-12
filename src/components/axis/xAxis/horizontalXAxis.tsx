import { Fragment } from "react";
import { DEFAULT_HORIZONTAL_BAR_OFFSET } from "../../../lib/core";
import { isTimeSerie } from "../../../lib/utils";
import type { TimeSerieEl } from "../../../types";
import type { XAxisProps } from "../axisProps";
import { useAxisBase } from "../useAxisBase";
import { AxisLine, AxisTitle, GridLine } from "./parts";

const HorizontalXAxis = (props: XAxisProps) => {
	const {
		name,
		dataPoints = [],
		showGrid = false,
		gridColor = undefined,
		labelSize = undefined,
		labelColor = undefined,
		titleSize = undefined,
		lineColor = undefined,
		showName = false,
		showLine = false,
		labelXOffset = 0,
		labelYOffset = 0,
		selectedValue,
		selectedColor,
		onLabelClick,
	} = props;

	const { ctx, interactive, dispatch, theme } = useAxisBase();

	if (!ctx || !theme) return null;

	const { padding } = theme;
	const {
		chartXEnd,
		chartXStart,
		chartYEnd,
		elements,
		globalConfig,
		hasTooltip,
	} = ctx;

	const hoveredElement = interactive?.hoveredElement;

	const labelFontSize = labelSize ?? theme?.axis?.labelSize;
	const labelTextColor = labelColor ?? theme.axis?.labelColor;

	const selectionValue = selectedValue;
	const selectionColor = selectedColor;

	const hasLabelClick = Boolean(onLabelClick);

	const triggerLabelClick = (label: string, index: number) => {
		onLabelClick?.(label, index);
	};

	const serie = elements?.find(isTimeSerie) ?? { data: [] };
	const serieData = serie.data as TimeSerieEl[];

	const yAxisInterval = (chartYEnd - padding) / (serieData?.length || 1);

	const isBarLikeSerie = ("type" in serie ? serie.type : undefined) !== "line";

	const labels = dataPoints.map((label, labelIndex) => {
		const ySpacing = padding / 2;
		const barOffset =
			typeof globalConfig?.barOffset === "number"
				? globalConfig.barOffset
				: DEFAULT_HORIZONTAL_BAR_OFFSET;
		return {
			value: label,
			x: chartXStart + barOffset - 6 + labelXOffset,
			y:
				yAxisInterval * labelIndex +
				ySpacing +
				(isBarLikeSerie
					? (ctx?.globalConfig?.barWidth
							? Number(ctx.globalConfig.barWidth)
							: padding) / 2
					: 0) +
				labelYOffset,
		};
	});

	const xPoints = labels.map((label, labelIndex) => {
		const hoverRectY = label.y - (yAxisInterval - padding) / 2;
		const hoverRectHeight = yAxisInterval - padding;

		const selectionFill =
			label.value === selectionValue ? `${selectionColor}26` : undefined;

		const width = chartXEnd;

		const labelFontWeight = label.value === selectionValue ? 700 : 400;

		const fill: string =
			hoveredElement?.elementIndex === labelIndex && hasLabelClick
				? "rgb(148,163,184,0.1)"
				: selectionFill
					? selectionFill
					: "transparent";

		const handleLabelClick = () => {
			triggerLabelClick(label.value, labelIndex);
		};

		const handleLabelHover = () => {
			if (dispatch && labelIndex !== hoveredElement?.elementIndex) {
				dispatch({
					type: "SET_HOVER_ELEMENT",
					payload: {
						hoveredElement: {
							elementIndex: labelIndex,
							label: label.value,
						},
					},
				});
			}
		};

		return (
			<Fragment key={`${label.value}-${labelIndex}`}>
				<>
					{showGrid ? (
						<GridLine
							d={`M ${chartXStart} ${label.y} H ${chartXEnd}`}
							theme={theme}
							gridColor={gridColor}
						/>
					) : null}
					{hasTooltip ? (
						<rect
							tabIndex={hasLabelClick ? 0 : undefined}
							role={hasLabelClick ? "button" : undefined}
							aria-label={hasLabelClick ? label.value : undefined}
							onClick={handleLabelClick}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									handleLabelClick();
								}
							}}
							onMouseEnter={handleLabelHover}
							onFocus={handleLabelHover}
							x={0}
							y={hoverRectY > 0 ? hoverRectY : 0}
							width={width}
							height={hoverRectHeight > 0 ? hoverRectHeight : 1}
							fill={fill}
						/>
					) : null}
				</>
				<text
					textAnchor="end"
					x={label.x}
					y={label.y}
					fontSize={labelFontSize}
					fontWeight={labelFontWeight}
					fill={labelTextColor}
				>
					{label.value}
				</text>
			</Fragment>
		);
	});

	return (
		<>
			{showLine ? (
				<AxisLine
					d={`M ${chartXStart} ${chartYEnd} H ${chartXStart}`}
					theme={theme}
					lineColor={lineColor}
				/>
			) : null}
			{xPoints}
			{showName ? (
				<AxisTitle
					x={chartXStart - 40}
					y={chartYEnd / 2}
					name={name}
					titleSize={titleSize}
					theme={theme}
					transform={`rotate(-90,${chartXStart - 40},${chartYEnd / 2})`}
				/>
			) : null}
		</>
	);
};

export default HorizontalXAxis;
