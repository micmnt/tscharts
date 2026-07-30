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

export type Serie = {
	name: string;
	uom?: string;
	data: TimeSerieEl[] | PieSerieEl[] | AngleDonutSerieEl[] | number;
	labels?: { name: string; value?: string }[];
	type?: string;
	axisName?: string;
	stackedName?: string;
	color?: string;
	format?: (value: number) => string;
};

export type ChartState = {
	elements?: Serie[];
	svgRef?: SVGSVGElement | null;
	mousePosition?: { x: number; y: number };
	tooltipPosition?: { x: number; y: number };
	hoveredElement?: { elementIndex: number; label: string } | null;
	width?: number;
	height?: number;
	chartXStart?: number;
	chartXEnd?: number;
	chartYEnd?: number;
	chartYMiddle?: number;
	negative?: boolean;
	horizontal?: boolean;
	flatMax?: boolean;
	timeSeriesMaxValue?: number;
	chartID?: string | null;
	globalConfig?: {
		[key: string]: number | string | ((v: unknown) => void);
	};
};

// Slice "strutturale" del ChartState: dati che cambiano raramente (elementi,
// dimensioni del grafico, config). Usata da tutti i componenti che disegnano
// dati ma non hanno bisogno di sapere dove si trova il mouse.
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
>;

// Slice "interattiva" del ChartState: dati che cambiano ad ogni movimento del
// mouse. Usata solo dai componenti che devono reagire all'hover (Tooltip,
// evidenziazione di punti/etichette).
export type ChartInteractiveState = Pick<
	ChartState,
	"mousePosition" | "tooltipPosition" | "hoveredElement"
>;

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
