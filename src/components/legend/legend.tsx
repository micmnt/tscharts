/* Types Imports */

/* Context Imports */
import {
	useChartsStructural,
	useChartsTheme,
} from "../../contexts/chartContext";
import { isPieSerie, warnDev } from "../../lib/utils";
import type { ChartState, PieSerieEl, Serie, ThemeState } from "../../types";

/* Styles Imports */
import "../../styles.css";
import type { ReactNode } from "react";

export type LegendProps = {
	showDots?: boolean;
	height?: number;
	hideSeries?: string[];
	customLabel?: (el: PieSerieEl | Serie) => ReactNode;
	legendType: "horizontal" | "vertical";
};

export const DEFAULT_LEGEND_HEIGHT = 60;

// Funzione che genera la legenda per un grafico di tipo XY
const generateXYChartLenged = (
	timeSeriesElements: Serie[],
	allElements: Serie[],
	theme: ThemeState | null,
	showDots: boolean,
	customLabel: ((el: PieSerieEl | Serie) => ReactNode) | null,
	hideSeries?: string[],
) => {
	// Filtro le serie che non voglio graficare nel tooltip
	const seriesToShow =
		(hideSeries ?? []).length > 0
			? timeSeriesElements.filter((serie) => !hideSeries?.includes(serie.name))
			: timeSeriesElements;

	return seriesToShow?.map((element) => {
		// Indice nell'intero ctx.elements (non nell'array gia' filtrato): deve
		// combaciare con quello usato da Bar/Line/ecc. per scegliere il colore,
		// altrimenti pie/donut intercalate sfasano la palette.
		const elementIndex = allElements.findIndex(
			(el) => el.name === element.name,
		);

		return (
			<div className="legendItemContainer" key={`${element.name}-legend`}>
				{showDots && (
					<div
						className="legendItemCircle"
						style={{
							backgroundColor:
								element.color ?? theme?.seriesColors?.[elementIndex],
						}}
					/>
				)}
				{customLabel ? (
					customLabel(element)
				) : (
					<span className="legendItemText">{element.name}</span>
				)}
			</div>
		);
	});
};

// Funzione che genera la legenda per un grafico a torta
const generatePieChartLegend = (
	pieSerieElements: PieSerieEl[],
	theme: ThemeState | null,
	showDots: boolean,
	customLabel: ((el: PieSerieEl | Serie) => ReactNode) | null,
	hideSeries?: string[],
) => {
	// Filtro le serie che non voglio graficare nel tooltip
	const seriesToShow =
		(hideSeries ?? []).length > 0
			? pieSerieElements.filter((serie) => !hideSeries?.includes(serie.name))
			: pieSerieElements;

	return seriesToShow?.map((element, elementIndex) => (
		<div className="legendItemContainer" key={`${element.name}-legend`}>
			{showDots && (
				<div
					className="legendItemCircle"
					style={{
						backgroundColor:
							element.color ?? theme?.seriesColors?.[elementIndex],
					}}
				/>
			)}
			{customLabel ? (
				customLabel(element)
			) : (
				<span className="legendItemText">{element.name}</span>
			)}
		</div>
	));
};

const Legend = (props: LegendProps) => {
	const {
		showDots = true,
		customLabel = null,
		legendType,
		height = DEFAULT_LEGEND_HEIGHT,
		hideSeries = [],
	} = props;

	const ctx = useChartsStructural();

	const theme = useChartsTheme();

	if (!ctx || !theme) {
		warnDev("<Legend /> deve essere renderizzato dentro <Chart>.");
		return null;
	}

	if (
		!legendType ||
		(legendType !== "horizontal" && legendType !== "vertical")
	) {
		warnDev('<Legend />: legendType deve essere "horizontal" o "vertical".');
		return null;
	}

	const { padding } = theme;

	const {
		elements,
		chartXStart: _chartXStart,
		chartXEnd: _chartXEnd,
		chartYEnd: _chartYEnd,
	} = ctx as ChartState;

	const chartXStart = _chartXStart as number;
	const chartXEnd = _chartXEnd as number;
	const chartYEnd = _chartYEnd as number;

	const legendY = ctx?.negative
		? 4 * padding + chartYEnd
		: 2 * padding + chartYEnd;
	const legendWidth = chartXEnd - chartXStart;

	if (!elements) return null;

	const timeSerieElements = elements.filter((el) => !isPieSerie(el));

	const pieSerieElements = elements.find(isPieSerie)?.data ?? [];

	const legendContainerSyle =
		legendType === "vertical" ? "legendVerticalContainer" : "legendContainer";

	return (
		<foreignObject
			x={chartXStart}
			y={legendY}
			width={legendWidth > 0 ? legendWidth : 20}
			height={height}
		>
			<div className={legendContainerSyle}>
				{timeSerieElements.length > 0
					? generateXYChartLenged(
							timeSerieElements,
							elements,
							theme,
							showDots,
							customLabel,
							hideSeries,
						)
					: generatePieChartLegend(
							pieSerieElements,
							theme,
							showDots,
							customLabel,
							hideSeries,
						)}
			</div>
		</foreignObject>
	);
};

export default Legend;
