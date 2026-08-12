import { Fragment } from "react";
import {
	createBandScale,
	generateXAxis,
	getCategorySpacing,
	NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER,
} from "../../../lib/core";
import { isTimeSerie } from "../../../lib/utils";
import type { TimeSerieEl } from "../../../types";
import type { XAxisProps } from "../axisProps";
import { useAxisBase } from "../useAxisBase";
import { AxisLine, AxisTitle, GridLine } from "./parts";

const CategoryXAxis = (props: XAxisProps) => {
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
		titleDx = 0,
		titleDy = 0,
		showLine = false,
		tiltLabels = true,
		labelXOffset = 0,
		labelYOffset = 0,
		tiltLabelsAngle = 45,
		selectedArea,
		selectedAreaColor,
		selectedAreaOpacity,
		selectedValue,
		selectedColor,
		onLabelClick,
		showLabels = true,
	} = props;

	const { ctx, interactive, theme } = useAxisBase();

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

	const xAxis = generateXAxis({ ...ctx, padding });

	const serie = elements?.find(isTimeSerie) ?? { data: [] };
	const serieData = serie.data as TimeSerieEl[];

	const xSpacing = getCategorySpacing(elements ?? [], globalConfig, padding);

	const xScale = createBandScale({
		start: chartXStart,
		end: chartXEnd,
		count: serieData?.length ?? 0,
		firstOffset: xSpacing,
	});

	const labels = dataPoints.map((label, labelIndex) => {
		return {
			value: label,
			x: xScale.position(labelIndex),
			y: ctx.negative
				? chartYEnd + NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER * padding
				: chartYEnd + padding,
		};
	});

	let selectedAreaRect = null;

	if (selectedArea) {
		const areaStartX = labels.find(
			(label) => label.value === selectedArea?.[0],
		)?.x;
		const areaEndX = labels.find(
			(label) => label.value === selectedArea?.[1],
		)?.x;
		const areaX = areaStartX ? areaStartX - xSpacing / 2 - padding / 6 : 0;
		const areaY = 0;
		const areaWidth =
			areaEndX && areaStartX
				? areaEndX - areaStartX + xSpacing + padding / 3
				: 0;
		const areaHeight = chartYEnd;

		selectedAreaRect = (
			<rect
				x={areaX}
				y={areaY}
				width={areaWidth}
				height={areaHeight > 0 ? areaHeight : 0}
				fill={selectedAreaColor ?? "red"}
				opacity={selectedAreaOpacity ?? 0.2}
			/>
		);
	}

	const xPoints = labels.map((label, labelIndex) => {
		const hoverRectWidth = ctx?.globalConfig?.barWidth ?? xScale.step - padding;

		const hoverRectX = label.x - hoverRectWidth / 2;

		const selectionFill =
			label.value === selectionValue ? `${selectionColor}26` : undefined;

		const height =
			label.value === selectionValue
				? (chartYEnd ?? 0) + 35
				: ctx.negative
					? chartYEnd + padding * 2
					: chartYEnd;

		const labelFontWeight = label.value === selectionValue ? 700 : 400;

		const fill: string =
			hoveredElement?.elementIndex === labelIndex && hasLabelClick
				? "rgb(148,163,184,0.1)"
				: selectionFill
					? selectionFill
					: "transparent";

		const labelX = label.x - labelXOffset;
		const labelY = label.y - labelYOffset;

		const handleLabelClick = () => {
			triggerLabelClick(label.value, labelIndex);
		};
		const labelRole: "button" | undefined = hasLabelClick
			? "button"
			: undefined;
		const labelTabIndex = hasLabelClick ? 0 : undefined;

		return (
			<Fragment key={`${label.value}-${labelIndex}`}>
				<>
					{showGrid ? (
						<GridLine
							d={`M ${label.x} ${chartYEnd + (padding * 1) / 3} V 0`}
							theme={theme}
							gridColor={gridColor}
						/>
					) : null}
					{hasTooltip ? (
						<rect
							x={hoverRectX > 0 ? hoverRectX : 0}
							y={0}
							width={hoverRectWidth > 0 ? hoverRectWidth : 1}
							height={height > 0 ? height : 0}
							fill={fill}
							style={{ pointerEvents: "none" }}
						/>
					) : null}
					{hasLabelClick ? (
						<rect
							tabIndex={labelTabIndex}
							role={labelRole}
							aria-label={label.value}
							onClick={handleLabelClick}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									handleLabelClick();
								}
							}}
							x={hoverRectX > 0 ? hoverRectX : 0}
							y={chartYEnd}
							width={hoverRectWidth > 0 ? hoverRectWidth : 1}
							height={40}
							fill="transparent"
							style={{ cursor: "pointer" }}
						/>
					) : null}
				</>
				{dataPoints.length > 20 && tiltLabels ? (
					<text
						dx={titleDx}
						dy={titleDy}
						fontSize={theme?.axis?.labelSize}
						fontWeight={labelFontWeight}
						fill={labelTextColor}
						textAnchor="start"
						x={labelX}
						y={labelY}
						style={hasLabelClick ? { pointerEvents: "none" } : undefined}
						transform={
							tiltLabels
								? `rotate(${tiltLabelsAngle}, ${label.x}, ${label.y})`
								: undefined
						}
					>
						{label.value}
					</text>
				) : (
					<text
						textAnchor="middle"
						x={labelX}
						y={labelY}
						fontSize={labelFontSize}
						fontWeight={labelFontWeight}
						fill={labelTextColor}
						style={hasLabelClick ? { pointerEvents: "none" } : undefined}
					>
						{label.value}
					</text>
				)}
			</Fragment>
		);
	});

	return (
		<>
			{selectedAreaRect}
			{showLine ? (
				<AxisLine d={xAxis?.path} theme={theme} lineColor={lineColor} />
			) : null}
			{showLabels ? xPoints : null}
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

export default CategoryXAxis;
