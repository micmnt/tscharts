import type { ReactNode } from "react";

import {
	useChartsInteractive,
	useChartsMouse,
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
import { calculateTooltipPosition } from "../../lib/core";
import type { PieSerieEl, Serie, ThemeState, TimeSerieEl } from "../../types";

import "../../styles.css";

import {
	isDefined,
	isPieSerie,
	isThresholdSerie,
	isTimeSerie,
	warnDev,
} from "../../lib/utils";

type Position = {
	x: number;
	y: number;
};

export type TooltipProps = {
	title?: (val: string) => string;
	reverseOrder?: boolean;
	showGrid?: boolean;

	intersect?: boolean;
	hideSeries?: string[];
	footer?: (series: Serie[], hoveredElementIndex: number) => ReactNode;
	cumulatedSeriesValue?: {
		series: string[];
		label: string;
		format?: (value: number) => string;
	};
	width?: number;
	height?: number;
	customElement?: (
		props: (TimeSerieEl | PieSerieEl) & { name: string; elementIndex?: number },
	) => ReactNode;
};

const getFormattedValue = (
	value: number | undefined,
	formatFn?: (value: number) => string,
) => {
	if (!isDefined(value)) return "";

	if (formatFn) return formatFn(value);

	return `${value}`;
};

const getElementValueByType = (element: Serie, dataIndex: number) => {
	if (isThresholdSerie(element)) return element.data;

	if (isTimeSerie(element) && dataIndex > -1) {
		return element.data[dataIndex]?.value;
	}

	return null;
};

const generateTimeSerieContent = (
	timeSeriesElements: Serie[],
	allElements: Serie[],
	theme: ThemeState | null,
	hoveredElement: { elementIndex: number; label: string } | null,
	reverseOrder: boolean,
	hideSeries?: string[],
	customElement?: (
		props: (TimeSerieEl | PieSerieEl) & { name: string; elementIndex?: number },
	) => ReactNode,
) => {
	const orderedTimeSeriesElements = reverseOrder
		? [...timeSeriesElements].reverse()
		: timeSeriesElements;

	const seriesToShow =
		(hideSeries ?? []).length > 0
			? orderedTimeSeriesElements.filter(
					(serie) => !hideSeries?.includes(serie.name),
				)
			: orderedTimeSeriesElements;

	return seriesToShow.map((element) => {
		const hoveredElementIndex = hoveredElement?.elementIndex ?? -1;

		const elementValue = getElementValueByType(element, hoveredElementIndex);

		if (customElement && hoveredElementIndex > -1) {
			return customElement({
				elementIndex: hoveredElementIndex,
				name: element.name,
				...((isTimeSerie(element) ? element.data : [])[hoveredElementIndex] ??
					{}),
			});
		}

		const serieIndex = allElements.findIndex((el) => el.name === element.name);

		return (
			<div className="tooltipSerieContainer" key={`tooltip-${element.name}`}>
				<div
					className="tooltipCircle"
					style={{
						backgroundColor:
							element.color ??
							theme?.seriesColors?.[serieIndex] ??
							theme?.seriesColors?.[0],
					}}
				/>
				<span className="tooltipText">
					{`${element.name}: ${isDefined(elementValue) ? getFormattedValue(elementValue, element.format) : "-"}`}
				</span>
			</div>
		);
	});
};

const generatePieSerieContent = (
	pieSeriesElements: PieSerieEl[],
	theme: ThemeState | null,
	hideSeries?: string[],
	customElement?: (
		props: (TimeSerieEl | PieSerieEl) & { name: string },
	) => ReactNode,
) => {
	const seriesToShow =
		(hideSeries ?? []).length > 0
			? pieSeriesElements.filter((serie) => !hideSeries?.includes(serie.name))
			: pieSeriesElements;

	return seriesToShow.map((element, serieIndex) => {
		if (customElement) {
			return customElement({ name: element.name, value: element.value });
		}

		return (
			<div className="tooltipSerieContainer" key={`tooltip-${element.name}`}>
				<div
					className="tooltipCircle"
					style={{
						backgroundColor: element.color ?? theme?.seriesColors?.[serieIndex],
					}}
				/>
				<span className="tooltipText">
					{`${element.name}: ${isDefined(element.value) ? getFormattedValue(element.value, element.format) : "-"}`}
				</span>
			</div>
		);
	});
};

const generateFooter = (
	elements: Serie[],
	hoveredElement: { elementIndex: number; label: string } | null,
	showTotal: boolean,
	tooltipTotal: ReactNode,
	footerFn?: (series: Serie[], hoveredElementIndex: number) => ReactNode,
) => {
	if (footerFn) {
		return footerFn(elements, hoveredElement?.elementIndex ?? -1);
	}

	return <div className="tooltipFooter">{showTotal ? tooltipTotal : null}</div>;
};

const computeStackedSeriesElementsTotal = (
	timeSeriesElements: Serie[],
	hoveredElement: { elementIndex: number; label: string } | null,
	enabledSeries?: string[],
	totalLabel?: string,
	format?: (value: number) => string,
) => {
	const filteredTimeSeriesElements =
		enabledSeries !== undefined &&
		enabledSeries !== null &&
		enabledSeries.length > 0
			? timeSeriesElements.filter((serie) => enabledSeries.includes(serie.name))
			: timeSeriesElements;

	const totalValue = filteredTimeSeriesElements.reduce((acc, element) => {
		const elementValue = getElementValueByType(
			element,
			hoveredElement?.elementIndex ?? -1,
		);

		acc += Number(elementValue);
		return acc;
	}, 0);

	const formattedTotal = format ? format(totalValue) : totalValue;

	return (
		<span className="tooltipTitle">{`${totalLabel}: ${formattedTotal}`}</span>
	);
};

const Tooltip = (props: TooltipProps) => {
	const {
		title = undefined,
		cumulatedSeriesValue,
		hideSeries = [],
		reverseOrder = false,
		footer = undefined,
		showGrid = false,
		width = 150,
		height = 0,
		customElement = undefined,
	} = props;

	const ctx = useChartsStructural();
	const interactive = useChartsInteractive();
	const mouse = useChartsMouse();

	const theme = useChartsTheme();

	if (!ctx) {
		warnDev("<Tooltip /> deve essere renderizzato dentro <Chart>.");
		return null;
	}

	const { elements, chartXStart, chartXEnd, chartYEnd, chartID } = ctx;

	const { hoveredElement: _hoveredElement } = interactive ?? {};

	const { mousePosition: _mousePosition, tooltipVisible } = mouse ?? {};

	if (!elements) return null;

	const timeSeriesElements = elements.filter(
		(el) => el.type !== "threshold" && !isPieSerie(el),
	);

	const tooltipRowElements = elements.filter((el) => !isPieSerie(el));

	const pieSeriesElements = elements.find(isPieSerie)?.data ?? [];

	const hoveredElement = _hoveredElement as {
		elementIndex: number;
		label: string;
	};

	const mousePosition: Position | null = _mousePosition ?? null;

	const tooltipTitle = title
		? title(hoveredElement?.label)
		: hoveredElement?.label;

	const tooltipTotal = computeStackedSeriesElementsTotal(
		timeSeriesElements,
		hoveredElement,
		cumulatedSeriesValue?.series ?? [],
		cumulatedSeriesValue?.label ?? "",
		cumulatedSeriesValue?.format ?? undefined,
	);

	const showTotal =
		cumulatedSeriesValue !== undefined &&
		cumulatedSeriesValue !== null &&
		Object.keys(cumulatedSeriesValue)?.length > 0;

	const tooltipHeight = height ? height : showTotal ? 200 : 160;

	const tooltipPosition = calculateTooltipPosition(
		mousePosition ?? { x: 0, y: 0 },
		chartXStart,
		chartXEnd,
		chartYEnd,
		width,
		tooltipHeight,
	);

	return (
		<>
			<foreignObject
				id={`cts-tooltip-${chartID}`}
				x={tooltipPosition.x}
				y={tooltipPosition.y}
				width={width}
				height={tooltipHeight}
				style={{
					display: tooltipVisible ? "block" : "none",
					pointerEvents: "none",
				}}
			>
				<div className="tooltipContainer">
					<span className="tooltipTitle">{tooltipTitle}</span>
					{timeSeriesElements.length > 0
						? generateTimeSerieContent(
								tooltipRowElements,
								elements,
								theme,
								hoveredElement,
								reverseOrder,
								hideSeries,
								customElement,
							)
						: generatePieSerieContent(
								pieSeriesElements,
								theme,
								hideSeries,
								customElement,
							)}
					{generateFooter(
						elements,
						hoveredElement,
						showTotal,
						tooltipTotal,
						footer,
					)}
				</div>
			</foreignObject>
			{showGrid &&
			tooltipVisible &&
			mousePosition &&
			mousePosition.x > chartXStart &&
			mousePosition.x < chartXEnd ? (
				<path
					d={`M ${mousePosition.x} ${chartYEnd} V 0`}
					strokeWidth={theme?.tooltip?.grid?.size}
					strokeDasharray={5}
					stroke={theme?.tooltip?.grid?.color}
					style={{ pointerEvents: "none" }}
				/>
			) : null}
			{showGrid &&
			tooltipVisible &&
			mousePosition &&
			mousePosition.y > 0 &&
			mousePosition.y < chartYEnd ? (
				<path
					d={`M ${chartXStart} ${mousePosition.y} H ${chartXEnd}`}
					strokeWidth={theme?.tooltip?.grid?.size}
					strokeDasharray={5}
					stroke={theme?.tooltip?.grid?.color}
					style={{ pointerEvents: "none" }}
				/>
			) : null}
		</>
	);
};

export default Tooltip;
