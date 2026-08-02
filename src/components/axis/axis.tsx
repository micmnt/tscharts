import { Fragment } from "react";
/* Context Imports */
import {
	useChartsDispatch,
	useChartsInteractive,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
/* Core Imports */
import {
	DEFAULT_HORIZONTAL_BAR_OFFSET,
	generateXAxis,
	generateYAxis,
	getGroupBarSlotCount,
	NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER,
} from "../../lib/core";
/* Utils Imports */
import { isFunction, isTimeSerie, warnDev } from "../../lib/utils";
/* Type Imports */
import type { TimeSerieEl } from "../../types";

export type AxisProps = {
	type: "xAxis" | "yAxis";
	name?: string;
	dataPoints?: string[];
	labelSize?: number;
	labelColor?: string;
	titleSize?: number;
	showGrid?: boolean;
	gridColor?: string;
	showLine?: boolean;
	showLabels?: boolean;
	lineColor?: string;
	titleDx?: number;
	titleDy?: number;
	showName?: boolean;
	tiltLabels?: boolean;
	horizontal?: boolean;
	labelXOffset?: number;
	labelYOffset?: number;
	tiltLabelsAngle?: number;
	selectedArea?: string[];
	selectedAreaColor?: string;
	selectedAreaOpacity?: number;
};

const Axis = (props: AxisProps) => {
	const {
		type,
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
		horizontal = false,
		labelXOffset = 0,
		labelYOffset = 0,
		tiltLabelsAngle = 45,
		selectedArea,
		selectedAreaColor,
		selectedAreaOpacity,
		showLabels = true,
	} = props;

	const ctx = useChartsStructural();
	const interactive = useChartsInteractive();

	const dispatch = useChartsDispatch();

	const theme = useChartsTheme();

	if (!ctx || !theme) {
		warnDev(`<Axis type="${type}" /> deve essere renderizzato dentro <Chart>.`);
		return null;
	}

	const { padding, yInterval } = theme;

	const {
		chartXEnd: _chartXEnd,
		chartXStart: _chartXStart,
		chartYEnd: _chartYEnd,
		elements,
		chartID,
		globalConfig,
	} = ctx;

	const hoveredElement = interactive?.hoveredElement;

	const chartXEnd = _chartXEnd as number;
	const chartXStart = _chartXStart as number;
	const chartYEnd = _chartYEnd as number;

	const tooltipElement = document?.getElementById(`cts-tooltip-${chartID}`);

	const labelFontSize = labelSize ?? theme?.axis?.labelSize;

	const labelTextColor = labelColor ?? theme.axis?.labelColor;

	// Creazione dell'asse X
	if (type === "xAxis") {
		// Nuova gestione per grafici orizzontali
		if (horizontal) {
			const serie = elements?.find(isTimeSerie) ?? { data: [] };
			const serieData = serie.data as TimeSerieEl[];

			const yAxisInterval = (chartYEnd - padding) / (serieData?.length || 1);

			const selectionColor = globalConfig?.selectedColor as string;
			const selectionValue = globalConfig?.selectedValue as string;

			// Una serie "line" disegna un punto singolo (nessuna altezza da
			// centrare); solo le serie bar-like occupano l'intera riga in
			// altezza e richiedono lo spostamento di meta' altezza per
			// centrare la label sulla barra.
			const isBarLikeSerie =
				("type" in serie ? serie.type : undefined) !== "line";

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

				const width = chartXEnd; // hover rect copre tutta la barra

				const labelFontWeight = label.value === selectionValue ? 700 : 400;

				const fill: string =
					hoveredElement?.elementIndex === labelIndex &&
					globalConfig?.barClickAction
						? "rgb(148,163,184,0.1)"
						: selectionFill
							? selectionFill
							: "transparent";

				const handleLabelClick = () => {
					if (
						globalConfig?.barClickAction &&
						isFunction(globalConfig.barClickAction)
					) {
						const serieEl = serieData[labelIndex];
						globalConfig.barClickAction(serieEl);
					}
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
								<path
									d={`M ${chartXStart} ${label.y} H ${chartXEnd}`}
									strokeWidth={theme?.grid?.size}
									strokeDasharray={theme?.grid?.dashed ? 5 : 0}
									stroke={gridColor ?? theme?.grid?.color}
								/>
							) : null}
							{tooltipElement ? (
								<rect
									tabIndex={globalConfig?.barClickAction ? 0 : undefined}
									role={globalConfig?.barClickAction ? "button" : undefined}
									aria-label={
										globalConfig?.barClickAction ? label.value : undefined
									}
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
						<path
							d={`M ${chartXStart} ${chartYEnd} H ${chartXStart}`}
							strokeWidth={theme?.axis?.size}
							stroke={lineColor ?? theme?.axis?.color}
						/>
					) : null}
					{xPoints}
					{showName ? (
						<text
							x={chartXStart - 40}
							y={chartYEnd / 2}
							textAnchor="middle"
							fontSize={titleSize ?? theme?.axis?.titleSize}
							fill={theme?.axis?.titleColor}
							fontWeight={600}
							transform={`rotate(-90,${chartXStart - 40},${chartYEnd / 2})`}
						>
							{name}
						</text>
					) : null}
				</>
			);
		}

		const xAxis = generateXAxis({ ...ctx, padding });

		const serie = elements?.find(isTimeSerie) ?? { data: [] };

		const serieData = serie.data as TimeSerieEl[];

		const xAxisInterval = (chartXEnd - chartXStart) / (serieData?.length || 1);

		const groupBarElements =
			elements?.filter((el) => el.type === "group-bar") ?? [];

		// Per GroupBar la label di categoria va centrata sulla larghezza totale
		// del gruppo (stessa formula barWidth+barGroupGap di K8), non su una
		// singola barra (K9).
		const xSpacing =
			groupBarElements.length > 0
				? (() => {
						const slotCount = getGroupBarSlotCount(elements ?? []);
						const barWidth = globalConfig?.barWidth
							? Number(globalConfig.barWidth)
							: padding;
						const barGroupGap = globalConfig?.barGroupGap
							? Number(globalConfig.barGroupGap)
							: padding / 4;
						const groupWidth =
							slotCount * barWidth + Math.max(0, slotCount - 1) * barGroupGap;
						const isStacked = groupBarElements.some((el) => el.stackedName);
						return (isStacked ? padding / 2 : padding / 4) + groupWidth / 2;
					})()
				: globalConfig?.barWidth
					? (Number(globalConfig?.barWidth) + padding) / 2
					: padding;

		const selectionColor = globalConfig?.selectedColor as string;
		const selectionValue = globalConfig?.selectedValue as string;

		const labels = dataPoints.map((label, labelIndex) => {
			return {
				value: label,
				x: xAxisInterval * labelIndex + chartXStart + xSpacing,
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
					height={areaHeight}
					fill={selectedAreaColor ?? "red"}
					opacity={selectedAreaOpacity ?? 0.2}
				/>
			);
		}

		const xPoints = labels.map((label, labelIndex) => {
			const hoverRectWidth =
				(ctx?.globalConfig?.barWidth as number) ?? xAxisInterval - padding;

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
				hoveredElement?.elementIndex === labelIndex &&
				globalConfig?.barClickAction
					? "rgb(148,163,184,0.1)"
					: selectionFill
						? selectionFill
						: "transparent";

			const labelX = label.x - labelXOffset;
			const labelY = label.y - labelYOffset;

			return (
				<Fragment key={`${label.value}-${labelIndex}`}>
					<>
						{showGrid ? (
							<path
								d={`M ${label.x} ${chartYEnd + (padding * 1) / 3} V 0`}
								strokeWidth={theme?.grid?.size}
								strokeDasharray={theme?.grid?.dashed ? 5 : 0}
								stroke={gridColor ?? theme?.grid?.color}
							/>
						) : null}
						{tooltipElement ? (
							<rect
								x={hoverRectX > 0 ? hoverRectX : 0}
								y={0}
								width={hoverRectWidth > 0 ? hoverRectWidth : 1}
								height={height}
								fill={fill}
								style={{ pointerEvents: "none" }}
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
					<path
						d={xAxis?.path}
						strokeWidth={theme?.axis?.size}
						stroke={lineColor ?? theme?.axis?.color}
					/>
				) : null}
				{showLabels ? xPoints : null}
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

	const foundSerieElement = elements?.find((el) => el.name === name);
	const serieElement =
		foundSerieElement && isTimeSerie(foundSerieElement)
			? foundSerieElement
			: undefined;

	if (!serieElement) {
		warnDev(
			`<Axis type="yAxis" name="${name}" />: nessuna serie di tipo bar/line/bar-stacked/group-bar trovata con questo name.`,
		);
		return null;
	}

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
				<Fragment key={`${yAxis.name}-${label.value}-${labelIndex}`}>
					<text
						textAnchor={yAxis.isOpposite ? "start" : "end"}
						fontSize={labelFontSize}
						x={label.x - 8}
						y={label.y + (labelFontSize ?? 0) / 2}
						fill={labelTextColor}
					>
						{label.value}
					</text>
					{showGrid && labelIndex > -1 ? (
						<path
							d={`M ${chartXStart + padding / 4} ${label.y} H ${chartXEnd - padding / 4}`}
							strokeWidth={theme?.grid?.size}
							strokeDasharray={theme?.grid?.dashed ? 5 : 0}
							stroke={gridColor ?? theme?.grid?.color}
						/>
					) : null}
				</Fragment>
			))}
			{showLine ? (
				<path
					d={yAxis.path}
					strokeWidth={theme?.axis?.size}
					stroke={lineColor ?? theme?.axis?.color}
				/>
			) : null}
		</Fragment>
	);
};

export default Axis;
