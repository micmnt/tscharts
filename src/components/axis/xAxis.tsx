import { Fragment } from "react";
/* Core Imports */
import {
	createBandScale,
	DEFAULT_HORIZONTAL_BAR_OFFSET,
	generateXAxis,
	getCategorySpacing,
	getChartTimeScale,
	NEGATIVE_CHART_X_AXIS_OFFSET_MULTIPLIER,
	normalizeTime,
} from "../../lib/core";
/* Utils Imports */
import { isFunction, isTimeSerie, warnDev } from "../../lib/utils";
/* Type Imports */
import type { TimeSerieEl } from "../../types";
import type { XAxisProps } from "./axisProps";
import { useAxisBase } from "./useAxisBase";

export type { XAxisProps } from "./axisProps";

const XAxis = (props: XAxisProps) => {
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
		horizontal = false,
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
		ticks = "data",
		tickFormat,
	} = props;

	const { ctx, interactive, dispatch, theme } = useAxisBase();

	if (!ctx || !theme) {
		warnDev("<XAxis /> deve essere renderizzato dentro <Chart>.");
		return null;
	}

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

	// Selezione di proprieta' dell'asse (M2): la prop vince, il canale
	// globalConfig (config.selectedValue/Color su Bar) resta fallback deprecato.
	const selectionValue = selectedValue ?? globalConfig?.selectedValue;
	const selectionColor = selectedColor ?? globalConfig?.selectedColor;

	// Una label e' interattiva se c'e' onLabelClick (API nuova, ha precedenza)
	// oppure il barClickAction del canale globalConfig (deprecato, dual-use ->
	// deprecation rimandata a M4). Chiama la prop se presente, altrimenti il
	// callback deprecato con il dato della serie (comportamento invariato).
	const hasLabelClick =
		Boolean(onLabelClick) || isFunction(globalConfig?.barClickAction);

	const triggerLabelClick = (
		label: string,
		index: number,
		serieEl: unknown,
	) => {
		if (onLabelClick) {
			onLabelClick(label, index);
		} else if (isFunction(globalConfig?.barClickAction)) {
			globalConfig.barClickAction(serieEl);
		}
	};

	// Nuova gestione per grafici orizzontali
	if (horizontal) {
		const serie = elements?.find(isTimeSerie) ?? { data: [] };
		const serieData = serie.data as TimeSerieEl[];

		const yAxisInterval = (chartYEnd - padding) / (serieData?.length || 1);

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
				hoveredElement?.elementIndex === labelIndex && hasLabelClick
					? "rgb(148,163,184,0.1)"
					: selectionFill
						? selectionFill
						: "transparent";

			const handleLabelClick = () => {
				triggerLabelClick(label.value, labelIndex, serieData[labelIndex]);
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

	// Asse tempo (S2b): tick posizionati dalla stessa scala usata dal generatore
	// line e dall'hover (getChartTimeScale). `ticks="data"` -> un tick per punto
	// dato (label = date grezza); numero -> N tick equispaziati (label via
	// tickFormat o toLocaleDateString). Nessun hover-rect/selezione qui: sono
	// concetti band, l'hover tempo e' gestito da svg.tsx (nearest point).
	const timeScale =
		ctx.scaleType === "time" ? getChartTimeScale({ ...ctx, padding }) : null;

	if (timeScale) {
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
					<path
						d={xAxis?.path}
						strokeWidth={theme?.axis?.size}
						stroke={lineColor ?? theme?.axis?.color}
					/>
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
										<path
											d={`M ${x} ${chartYEnd + (padding * 1) / 3} V 0`}
											strokeWidth={theme?.grid?.size}
											strokeDasharray={theme?.grid?.dashed ? 5 : 0}
											stroke={gridColor ?? theme?.grid?.color}
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

	// Offset della prima categoria: stessa fonte di verita' usata da svg.tsx
	// per l'hover (getCategorySpacing), cosi' label dell'asse e aggancio del
	// mouse restano allineati. Per GroupBar tiene conto della larghezza
	// dell'intero gruppo (K9/K10), non di una singola barra.
	const xSpacing = getCategorySpacing(elements ?? [], globalConfig, padding);

	// Scala band "centro categoria": label dell'asse (position) e hover di
	// svg.tsx (invert) consumano la STESSA scala, quindi non possono divergere.
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
};

export default XAxis;
