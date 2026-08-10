// Props condivise dai due assi (X e Y).
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

// Asse X: categorie (dataPoints), tilt delle label, orientamento orizzontale,
// selezione e click sulle label (M2).
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
};

// Asse Y: `name` identifica la scala (di fatto obbligatorio: warnDev se nessuna
// serie combacia).
export type YAxisProps = AxisBaseProps;

// Alias deprecato <Axis type="...">: union discriminata sul `type`, cosi' con
// type="xAxis" si ottengono le props X e con type="yAxis" quelle Y.
export type AxisProps =
	| ({ type: "xAxis" } & XAxisProps)
	| ({ type: "yAxis" } & YAxisProps);
