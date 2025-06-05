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

export type Serie = {
	name: string;
	uom?: string;
	data: TimeSerieEl[] | PieSerieEl[] | number;
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
	timeSeriesMaxValue?: number;
	chartID?: string | null;
	globalConfig?: {
		[key: string]: number | string | ((v: unknown) => void);
	};
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
