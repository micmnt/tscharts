import type { GlobalConfig } from "./lib/globalConfig";

export type TimeSerieEl = {
	value: number;
	date: string;
};

export type PieSerieEl = {
	value: number;
	name: string;
	color?: string;
	format?: (value: number) => string;
};

export type AngleDonutSerieEl = PieSerieEl & {
	maxValue?: number;
	trackColor?: string;
};

type BaseSerie = {
	name: string;
	uom?: string;
	axisName?: string;
	stackedName?: string;
	color?: string;
	format?: (value: number) => string;
};

export type TimeSerie = BaseSerie & {
	type: "line" | "bar" | "bar-stacked" | "group-bar";
	data: TimeSerieEl[];
};

export type PieSerie = BaseSerie & {
	type: "pie" | "donut";
	data: PieSerieEl[];

	labels?: { name: string; value?: string }[];
};

export type AngleDonutSerie = BaseSerie & {
	type: "angle-donut";
	data: AngleDonutSerieEl[];
};

export type ThresholdSerie = BaseSerie & {
	type: "threshold";
	data: number;
};

export type Serie = TimeSerie | PieSerie | AngleDonutSerie | ThresholdSerie;

export type ChartState = {
	elements?: Serie[];
	svgRef?: SVGSVGElement | null;

	hoveredElement?: { elementIndex: number; label: string } | null;

	width: number;
	height: number;
	chartXStart: number;
	chartXEnd: number;
	chartYEnd: number;
	chartYMiddle: number;
	negative?: boolean;
	horizontal?: boolean;
	flatMax?: boolean;
	timeSeriesMaxValue?: number;
	chartID?: string | null;
	globalConfig?: GlobalConfig;

	scaleType?: "band" | "time";
	parseDate?: (date: string) => number | Date;
	timeDomain?: readonly [number, number];

	yMin?: number;
	yMax?: number;

	zoomable?: boolean;
	yBaseDomain?: readonly [number, number];
	zoomDomain?: readonly [number, number] | null;

	hasTooltip?: boolean;
};

export type ChartStructuralState = Pick<
	ChartState,
	| "elements"
	| "svgRef"
	| "width"
	| "height"
	| "chartXStart"
	| "chartXEnd"
	| "chartYEnd"
	| "chartYMiddle"
	| "negative"
	| "horizontal"
	| "flatMax"
	| "timeSeriesMaxValue"
	| "chartID"
	| "globalConfig"
	| "hasTooltip"
	| "scaleType"
	| "parseDate"
	| "timeDomain"
	| "yMin"
	| "yMax"
	| "zoomable"
	| "yBaseDomain"
	| "zoomDomain"
>;

export type ChartInteractiveState = Pick<ChartState, "hoveredElement">;

export type ChartOverlayState = {
	el: HTMLDivElement | null;
	pointer: { x: number; y: number } | null;
	width: number;
	height: number;
};

export type ChartMouseState = {
	mousePosition: { x: number; y: number } | null;
	tooltipVisible: boolean;
	overlay: ChartOverlayState;
};

export type ThemeState = {
	padding: number;
	yInterval: number;
	grid?: {
		color?: string;
		size?: number;
		dashed?: boolean;
	};
	line: {
		size: number;
	};
	tooltip?: {
		grid?: {
			color?: string;
			size?: number;
			dashed?: boolean;
		};
	};
	legend?: {
		textColor?: string;
		textSize?: number;
	};
	threshold?: {
		size?: number;
		dash?: number;
		textSize?: number;
	};
	seriesColors?: string[];
	axis?: {
		color?: string;
		labelColor?: string;
		titleColor?: string;
		size?: number;
		labelSize?: number;
		titleSize?: number;
	};
};
