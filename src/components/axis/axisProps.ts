export type AxisBaseProps = {
	name?: string;
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
};

export type XAxisProps = AxisBaseProps & {
	dataPoints?: string[];
	tiltLabels?: boolean;
	tiltLabelsAngle?: number;
	horizontal?: boolean;
	labelXOffset?: number;
	labelYOffset?: number;
	selectedArea?: string[];
	selectedAreaColor?: string;
	selectedAreaOpacity?: number;
	selectedValue?: string;
	selectedColor?: string;
	onLabelClick?: (label: string, index: number) => void;

	scaleType?: "band" | "time";

	parseDate?: (date: string) => number | Date;

	ticks?: "data" | number;

	tickFormat?: (time: number) => string;
};

export type YAxisProps = AxisBaseProps & {
	min?: number;
	max?: number;

	zoomable?: boolean;
	onZoomChange?: (domain: [number, number] | null) => void;

	zoomStep?: number;

	zoomSnap?: number;
};
