/* Types Imports */
import type { ReactNode } from "react";

/* Context Imports */
import { useCharts, useChartsTheme } from "../../contexts/chartContext";
import type { PieSerieEl, Serie, ThemeState, TimeSerieEl } from "../../types";

/* Styles Imports */
import "../../styles.css";

/* Utils Imports */
import { isDefined } from "../../lib/utils";

type Position = {
	x: number;
	y: number;
};

export type TooltipProps = {
	title?: (val: string) => string;
	reverseOrder?: boolean;
	showGrid?: boolean;
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

const getElementValueByType = (
	data: TimeSerieEl[] | PieSerieEl[] | number,
	type: string,
	dataIndex: number,
) => {
	if (type === "threshold") return data as number;

	if (dataIndex > -1) {
		const serieEl = data as TimeSerieEl[];
		return serieEl[dataIndex]?.value;
	}

	return null;
};

// Funzione che genera i valori del tooltip per una timeSerie
const generateTimeSerieContent = (
	timeSeriesElements: Serie[],
	theme: ThemeState | null,
	hoveredElement: { elementIndex: number; label: string } | null,
	reverseOrder: boolean,
	hideSeries?: string[],
	customElement?: (
		props: (TimeSerieEl | PieSerieEl) & { name: string; elementIndex?: number },
	) => ReactNode,
) => {
	// Ordino l'array di valori in base all'ordinamento scelto
	const orderedTimeSeriesElements = reverseOrder
		? [...timeSeriesElements].reverse()
		: timeSeriesElements;

	// Filtro le serie che non voglio graficare nel tooltip
	const seriesToShow =
		(hideSeries ?? []).length > 0
			? orderedTimeSeriesElements.filter(
					(serie) => !hideSeries?.includes(serie.name),
				)
			: orderedTimeSeriesElements;

	return seriesToShow.map((element, serieIndex) => {
		const hoveredElementIndex = hoveredElement?.elementIndex ?? -1;

		const elementValue = getElementValueByType(
			element.data,
			element.type as string,
			hoveredElementIndex,
		);

		if (customElement && hoveredElementIndex > -1) {
			return customElement({
				elementIndex: hoveredElementIndex,
				name: element.name,
				...((element.data as TimeSerieEl[])?.[hoveredElementIndex] ?? {}),
			});
		}

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

// Funzione che genera i valori del tooltip per una pieSerie
const generatePieSerieContent = (
	pieSeriesElements: PieSerieEl[],
	theme: ThemeState | null,
	hideSeries?: string[],
	customElement?: (
		props: (TimeSerieEl | PieSerieEl) & { name: string },
	) => ReactNode,
) => {
	// Filtro le serie che non voglio graficare nel tooltip
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

// Funzione che genera il footer del tooltip
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

// Funzione che genera i valori dei totali dei singoli elementi di una Serie stacked
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
			element.data,
			element.type as string,
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

	const ctx = useCharts();

	const theme = useChartsTheme();

	if (!ctx) return null;

	const {
		elements,
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
		tooltipPosition: _tooltipPosition,
		mousePosition: _mousePosition,
		hoveredElement: _hoveredElement,
		chartID,
	} = ctx;

	if (!elements) return null;

	const timeSeriesElements = elements.filter(
		(el) => el.type !== "threshold" && el.type !== "pie",
	);

	const pieSeriesElements = elements.filter((el) => el.type === "pie")?.[0]
		?.data;

	const hoveredElement = _hoveredElement as {
		elementIndex: number;
		label: string;
	};

	const tooltipPosition = _tooltipPosition as Position;

	const mousePosition = _mousePosition as Position;

	const chartYEnd = _chartYEnd as number;
	const chartXEnd = _chartXEnd as number;
	const chartXStart = _chartXStart as number;

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

	return (
		<>
			<foreignObject
				id={`cts-tooltip-${chartID}`}
				x={tooltipPosition.x}
				y={tooltipPosition.y}
				width={width}
				height={height ? height : showTotal ? 200 : 160}
				style={{ display: "none" }}
			>
				<div className="tooltipContainer">
					<span className="tooltipTitle">{tooltipTitle}</span>
					{timeSeriesElements.length > 0
						? generateTimeSerieContent(
								timeSeriesElements,
								theme,
								hoveredElement,
								reverseOrder,
								hideSeries,
								customElement,
							)
						: generatePieSerieContent(
								pieSeriesElements as PieSerieEl[],
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
			mousePosition.x > chartXStart &&
			mousePosition.x < chartXEnd ? (
				<path
					d={`M ${mousePosition.x} ${chartYEnd} V 0`}
					strokeWidth={theme?.tooltip?.grid?.size}
					strokeDasharray={5}
					stroke={theme?.tooltip?.grid?.color}
				/>
			) : null}
			{showGrid && mousePosition.y > 0 && mousePosition.y < chartYEnd ? (
				<path
					d={`M ${chartXStart} ${mousePosition.y} H ${chartXEnd}`}
					strokeWidth={theme?.tooltip?.grid?.size}
					strokeDasharray={5}
					stroke={theme?.tooltip?.grid?.color}
				/>
			) : null}
		</>
	);
};

export default Tooltip;
