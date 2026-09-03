import {
	Fragment,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

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

const useIsomorphicLayoutEffect =
	typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type TooltipSerieRow = {
	name: string;

	value: number | null;

	formatted: string;

	color?: string;

	serie: Serie;
};

export type TooltipRenderProps = {
	label: string;

	index: number;

	series: TooltipSerieRow[];
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

	render?: (props: TooltipRenderProps) => ReactNode;
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

const getSeriesToShow = <T extends { name: string }>(
	items: T[],
	reverseOrder: boolean,
	hideSeries?: string[],
) => {
	const ordered = reverseOrder ? [...items].reverse() : items;

	return (hideSeries ?? []).length > 0
		? ordered.filter((item) => !hideSeries?.includes(item.name))
		: ordered;
};

const buildTimeSerieRows = (
	timeSeriesElements: Serie[],
	allElements: Serie[],
	theme: ThemeState | null,
	hoveredElementIndex: number,
	reverseOrder: boolean,
	hideSeries?: string[],
): TooltipSerieRow[] =>
	getSeriesToShow(timeSeriesElements, reverseOrder, hideSeries).map(
		(element) => {
			const elementValue = getElementValueByType(element, hoveredElementIndex);
			const serieIndex = allElements.findIndex(
				(el) => el.name === element.name,
			);

			return {
				name: element.name,
				value: isDefined(elementValue) ? elementValue : null,
				formatted: isDefined(elementValue)
					? getFormattedValue(elementValue, element.format)
					: "-",
				color:
					element.color ??
					theme?.seriesColors?.[serieIndex] ??
					theme?.seriesColors?.[0],
				serie: element,
			};
		},
	);

const buildPieSerieRows = (
	pieSerie: Serie | undefined,
	pieSeriesElements: PieSerieEl[],
	theme: ThemeState | null,
	hideSeries?: string[],
): TooltipSerieRow[] =>
	getSeriesToShow(pieSeriesElements, false, hideSeries).map(
		(element, serieIndex) => ({
			name: element.name,
			value: isDefined(element.value) ? element.value : null,
			formatted: isDefined(element.value)
				? getFormattedValue(element.value, element.format)
				: "-",
			color: element.color ?? theme?.seriesColors?.[serieIndex],
			serie: pieSerie as Serie,
		}),
	);

const SerieRow = ({ row }: { row: TooltipSerieRow }) => (
	<div className="tooltipSerieContainer">
		<div className="tooltipCircle" style={{ backgroundColor: row.color }} />
		<span className="tooltipText">{`${row.name}: ${row.formatted}`}</span>
	</div>
);

const generateTimeSerieContent = (
	rows: TooltipSerieRow[],
	hoveredElementIndex: number,
	customElement?: (
		props: (TimeSerieEl | PieSerieEl) & { name: string; elementIndex?: number },
	) => ReactNode,
) =>
	rows.map((row) => {
		const content =
			customElement && hoveredElementIndex > -1 ? (
				customElement({
					elementIndex: hoveredElementIndex,
					name: row.name,
					...((isTimeSerie(row.serie) ? row.serie.data : [])[
						hoveredElementIndex
					] ?? {}),
				})
			) : (
				<SerieRow row={row} />
			);

		return <Fragment key={`tooltip-${row.name}`}>{content}</Fragment>;
	});

const generatePieSerieContent = (
	rows: TooltipSerieRow[],
	customElement?: (
		props: (TimeSerieEl | PieSerieEl) & { name: string },
	) => ReactNode,
) =>
	rows.map((row) => {
		const content = customElement ? (
			customElement({ name: row.name, value: row.value as number })
		) : (
			<SerieRow row={row} />
		);

		return <Fragment key={`tooltip-${row.name}`}>{content}</Fragment>;
	});

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
		render = undefined,
	} = props;

	const autoWidth = render !== undefined && props.width === undefined;

	const ctx = useChartsStructural();
	const interactive = useChartsInteractive();
	const mouse = useChartsMouse();

	const theme = useChartsTheme();

	const boxRef = useRef<HTMLDivElement>(null);
	const [boxSize, setBoxSize] = useState({ width, height: height || 160 });

	useIsomorphicLayoutEffect(() => {
		const el = boxRef.current;
		if (!el) return;

		const measured = { width: el.offsetWidth, height: el.offsetHeight };
		setBoxSize((prev) =>
			prev.width === measured.width && prev.height === measured.height
				? prev
				: measured,
		);
	});

	if (!ctx) {
		warnDev("<Tooltip /> deve essere renderizzato dentro <Chart>.");
		return null;
	}

	const { elements, chartXStart, chartXEnd, chartYEnd, chartID } = ctx;

	const { hoveredElement: _hoveredElement } = interactive ?? {};

	const {
		mousePosition: _mousePosition,
		tooltipVisible,
		overlay,
	} = mouse ?? {};

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

	const overlayEl = overlay?.el ?? null;
	const overlayPointer = overlay?.pointer ?? null;

	const tooltipPosition = calculateTooltipPosition({
		pointer: overlayPointer ?? { x: 0, y: 0 },
		tooltip: boxSize,
		bounds: {
			width: overlay?.width ?? 0,
			height: overlay?.height ?? 0,
		},
	});

	const hoveredElementIndex = hoveredElement?.elementIndex ?? -1;

	const isTimeSerieTooltip = timeSeriesElements.length > 0;

	const serieRows = isTimeSerieTooltip
		? buildTimeSerieRows(
				tooltipRowElements,
				elements,
				theme,
				hoveredElementIndex,
				reverseOrder,
				hideSeries,
			)
		: buildPieSerieRows(
				elements.find(isPieSerie),
				pieSeriesElements,
				theme,
				hideSeries,
			);

	const tooltipBox = (
		<div
			ref={boxRef}
			id={`cts-tooltip-${chartID}`}
			className="tooltipOverlay"
			style={{
				width: autoWidth ? undefined : width,
				minHeight: height || undefined,
				transform: `translate(${tooltipPosition.x}px, ${tooltipPosition.y}px)`,
			}}
		>
			{render ? (
				render({
					label: hoveredElement?.label ?? "",
					index: hoveredElementIndex,
					series: serieRows,
				})
			) : (
				<div className="tooltipContainer">
					<span className="tooltipTitle">{tooltipTitle}</span>
					{isTimeSerieTooltip
						? generateTimeSerieContent(
								serieRows,
								hoveredElementIndex,
								customElement,
							)
						: generatePieSerieContent(serieRows, customElement)}
					{generateFooter(
						elements,
						hoveredElement,
						showTotal,
						tooltipTotal,
						footer,
					)}
				</div>
			)}
		</div>
	);

	return (
		<>
			{tooltipVisible && overlayEl && overlayPointer
				? createPortal(tooltipBox, overlayEl)
				: null}
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
