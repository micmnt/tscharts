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
	// Label personalizzate al centro (donut) / accanto alle fette: usate solo da
	// pie/donut, quindi vivono qui e non su BaseSerie (v1.0).
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

// Union discriminata su `type`: a seconda del valore di `type`, TypeScript
// restringe automaticamente la forma di `data` senza bisogno di cast (as
// TimeSerieEl[] / as PieSerieEl[] / as number) sparsi nel codice. `type` e'
// obbligatorio (prima era opzionale): e' il campo discriminante, senza il
// quale la union non puo' restringere nulla. Cambio di tipo "breaking" per
// chi omette `type` oggi - da trattare come major bump alla pubblicazione.
// I type guard runtime associati (isTimeSerie, isPieSerie, ecc.) sono in
// lib/utils.ts, insieme agli altri predicate di runtime (isDefined, isFunction).
export type Serie = TimeSerie | PieSerie | AngleDonutSerie | ThresholdSerie;

export type ChartState = {
	elements?: Serie[];
	svgRef?: SVGSVGElement | null;
	// NB: mousePosition e tooltipVisible NON stanno piu' qui (R17): sono uno
	// stato locale di <Svg>, esposto ai children via ChartMouseContext, cosi' il
	// reducer/ChartProvider non gira a ogni movimento del mouse. Vedi
	// ChartMouseState.
	hoveredElement?: { elementIndex: number; label: string } | null;
	// Dimensioni del grafico: non-opzionali (R9). Valgono 0 finche' il container
	// non e' misurato (initialState); i valori reali arrivano con INITIALIZE.
	// Tenerle `number` (non `number | undefined`) elimina ~40 cast `as number`
	// sparsi nei componenti e nelle funzioni core; lo 0 "non inizializzato" e'
	// gestito dai gate (Svg su height, initializeChart su chartYEnd > 0).
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
	// Asse X temporale (S2b): "time" posiziona i punti delle serie line in modo
	// proporzionale alla data (non all'indice). `parseDate` converte la stringa
	// `date` in ms epoch (default new Date(d).getTime()); `timeDomain` e' il
	// [min,max] gia' calcolato da <Chart> dai dati delle serie line.
	scaleType?: "band" | "time";
	parseDate?: (date: string) => number | Date;
	timeDomain?: readonly [number, number];
	// Dominio Y controllabile (S1b): override di [0, max-auto] letto da
	// <YAxis min max>. Singolo asse, grafici verticali non-negativi.
	yMin?: number;
	yMax?: number;
	// Zoom interattivo Y (S3): `zoomable` da <YAxis zoomable>; `yBaseDomain` e' il
	// dominio di partenza/reset ([yMin??0, yMax??autoMax], calcolato da Chart);
	// `zoomDomain` e' il dominio interattivo corrente (null = nessuno zoom).
	zoomable?: boolean;
	yBaseDomain?: readonly [number, number];
	zoomDomain?: readonly [number, number] | null;
	// Se nel chart e' presente un <Tooltip>: axis.tsx lo usa per decidere se
	// renderizzare gli hover-rect, senza piu' interrogare il DOM (R7).
	hasTooltip?: boolean;
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

// Slice "interattiva" del ChartState: l'elemento in hover, che cambia solo al
// cambio di categoria (non a ogni pixel). Consumata da Tooltip, Line, Axis per
// l'evidenziazione.
export type ChartInteractiveState = Pick<ChartState, "hoveredElement">;

// Stato del mouse (R17): vive LOCALE in <Svg> (useState), non nel reducer, ed
// e' esposto ai children via ChartMouseContext. Cambia a ogni movimento del
// mouse, quindi tenerlo fuori dal reducer evita di far girare ChartProvider e
// i consumatori che non ne hanno bisogno (Line/Axis). Lo consuma solo il
// Tooltip (posizione + righe guida + visibilita').
export type ChartMouseState = {
	mousePosition: { x: number; y: number } | null;
	tooltipVisible: boolean;
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
