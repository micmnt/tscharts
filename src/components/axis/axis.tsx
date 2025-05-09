import { Fragment } from "react";

/* Type Imports */
import type { TimeSerieEl } from "../../types";

/* Core Imports */
import { generateXAxis, generateYAxis } from "../../lib/core";

/* Utils Imports */
import { isFunction } from "../../lib/utils";

import { nanoid } from "nanoid";
/* Context Imports */
import {
	useCharts,
	useChartsDispatch,
	useChartsTheme,
} from "../../contexts/chartContext";

export type AxisProps = {
	type: "xAxis" | "yAxis";
	name?: string;
	dataPoints?: string[];
	labelSize?: number;
	labelColor?: string;
	titleSize?: number;
	showGrid?: boolean;
	showLine?: boolean;
	titleDx?: number;
	titleDy?: number;
	showName?: boolean;
};

const Axis = (props: AxisProps) => {
	const {
		type,
		name,
		dataPoints = [],
		showGrid = false,
		labelSize = undefined,
		labelColor = undefined,
		titleSize = undefined,
		showName = false,
		titleDx = 0,
		titleDy = 0,
		showLine = false,
	} = props;

	const ctx = useCharts();

	const dispatch = useChartsDispatch();

	const theme = useChartsTheme();

	if (!ctx || !theme) return null;

	const { padding, yInterval } = theme;

	const {
		chartXEnd: _chartXEnd,
		chartXStart: _chartXStart,
		chartYEnd: _chartYEnd,
		elements,
		hoveredElement,
		chartID,
		globalConfig,
	} = ctx;

	const chartXEnd = _chartXEnd as number;
	const chartXStart = _chartXStart as number;
	const chartYEnd = _chartYEnd as number;

	const tooltipElement = document?.getElementById(`cts-tooltip-${chartID}`);

	const labelFontSize = labelSize ?? theme?.axis?.labelSize;

	const labelTextColor = labelColor ?? theme.axis?.labelColor;

	// Creazione dell'asse X
	if (type === "xAxis") {
		const xAxis = generateXAxis(ctx);

		const serie = elements?.[0] || { data: [] };

		const serieData = serie.data as TimeSerieEl[];

		const xAxisInterval = (chartXEnd - chartXStart) / (serieData?.length || 1);

		const selectionColor = globalConfig?.selectedColor as string;
		const selectionValue = globalConfig?.selectedValue as string;

		const labels = dataPoints.map((label, labelIndex) => {
			const xSpacing = globalConfig?.barWidth
				? (Number(globalConfig?.barWidth) + padding) / 2
				: padding;

			return {
				value: label,
				x: xAxisInterval * labelIndex + chartXStart + xSpacing,
				y: chartYEnd + padding,
			};
		});

		const xPoints = labels.map((label, labelIndex) => {
			const hoverRectX = label.x - (xAxisInterval - padding) / 2;
			const hoverRectWidth = xAxisInterval - padding;

			const selectionFill =
				label.value === selectionValue ? `${selectionColor}26` : undefined;

			const height =
				label.value === selectionValue ? (chartYEnd ?? 0) + 35 : chartYEnd;

			const labelFontWeight = label.value === selectionValue ? 700 : 400;

			const fill: string =
				hoveredElement?.elementIndex === labelIndex &&
				globalConfig?.barClickAction
					? "rgb(148,163,184,0.1)"
					: selectionFill
						? selectionFill
						: "transparent";

			return (
				<Fragment key={`${label.value}-${nanoid()}`}>
					<>
						{showGrid ? (
							<path
								d={`M ${label.x} ${chartYEnd + (padding * 1) / 3} V 0`}
								strokeWidth={theme?.grid?.size}
								strokeDasharray={theme?.grid?.dashed ? 5 : 0}
								stroke={theme?.grid?.color}
							/>
						) : null}
						{tooltipElement ? (
							<rect
								onClick={() => {
									if (
										globalConfig?.barClickAction &&
										isFunction(globalConfig.barClickAction)
									) {
										const serieEl = serieData[labelIndex];
										globalConfig.barClickAction(serieEl);
									}
								}}
								onMouseEnter={() => {
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
								}}
								x={hoverRectX > 0 ? hoverRectX : 0}
								y={0}
								width={hoverRectWidth > 0 ? hoverRectWidth : 1}
								height={height}
								fill={fill}
							/>
						) : null}
					</>
					{dataPoints.length > 20 ? (
						<>
							<defs>
								<path
									id={`xAxisLabel-${labelIndex}`}
									d={`M ${label.x - 40} ${label.y + 20} L ${label.x} ${label.y}`}
								/>
							</defs>
							{/* <use href={`#xAxisLabel-${labelIndex}`} fill="none" /> */}
							<text
								dx={titleDx}
								dy={titleDy}
								fontSize={theme?.axis?.labelSize}
								fontWeight={labelFontWeight}
								fill={labelTextColor}
							>
								<textPath
									textAnchor="start"
									x={label.x}
									y={label.y}
									href={`#xAxisLabel-${labelIndex}`}
								>
									{label.value}
								</textPath>
							</text>
						</>
					) : (
						<text
							textAnchor="middle"
							x={label.x}
							y={label.y}
							fontSize={labelFontSize}
							fontWeight={labelFontWeight}
							fill={labelTextColor}
						>
							{label.value}
						</text>
					)}
				</Fragment>
			);
		});

		return (
			<>
				{showLine ? (
					<path
						d={xAxis?.path}
						strokeWidth={theme?.axis?.size}
						stroke={theme?.axis?.color}
					/>
				) : null}
				{xPoints}
				{showName ? (
					<text
						x={chartXEnd / 2}
						y={chartYEnd + 45}
						textAnchor="middle"
						fontSize={titleSize ?? theme?.axis?.titleSize}
						fill={theme?.axis?.titleColor}
						fontWeight={600}
					>
						{name}
					</text>
				) : null}
			</>
		);
	}

	const serieElement = elements?.find((el) => el.name === name);

	if (!serieElement) return null;

	// Creazione dell'asse Y
	const yAxis = generateYAxis(serieElement, { ...ctx, padding, yInterval });

	if (!yAxis) return null;

	return (
		<Fragment>
			{showName ? (
				<>
					<defs>
						<path d={yAxis.nameLabelPath} id={`axis-${yAxis.nameLabelPath}`} />
					</defs>
					<text
						dy={titleDy}
						dx={titleDx}
						fontSize={titleSize ?? theme?.axis?.titleSize}
						fill={theme?.axis?.titleColor}
						fontWeight={600}
						textAnchor="middle"
						dominantBaseline="middle"
					>
						<textPath startOffset="50%" href={`#axis-${yAxis.nameLabelPath}`}>
							{yAxis.uom ? `${yAxis.name} (${yAxis.uom})` : `${yAxis.name}`}
						</textPath>
					</text>
				</>
			) : null}
			{yAxis.valueLabels.map((label, labelIndex) => (
				<Fragment key={`${yAxis.name}-${label.value}-${nanoid()}`}>
					<text
						textAnchor={yAxis.isOpposite ? "start" : "end"}
						fontSize={labelFontSize}
						x={label.x}
						y={label.y + (labelFontSize ?? 0) / 2}
						fill={labelTextColor}
					>
						{label.value}
					</text>
					{showGrid && labelIndex > 0 ? (
						<path
							d={`M ${chartXStart + padding / 4} ${label.y} H ${chartXEnd - padding / 4}`}
							strokeWidth={theme?.grid?.size}
							strokeDasharray={theme?.grid?.dashed ? 5 : 0}
							stroke={theme?.grid?.color}
						/>
					) : null}
				</Fragment>
			))}
			{showLine ? (
				<path
					d={yAxis.path}
					strokeWidth={theme?.axis?.size}
					stroke={theme?.axis?.color}
				/>
			) : null}
		</Fragment>
	);
};

export default Axis;
