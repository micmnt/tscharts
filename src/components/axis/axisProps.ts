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
	// Asse temporale (S2b): "time" posiziona i punti delle serie line
	// proporzionalmente alla data. Default "band" (categorico, comportamento
	// storico).
	scaleType?: "band" | "time";
	// Converte la stringa `date` in ms epoch (o Date). Default
	// `new Date(d).getTime()`. Serve quando `date` non e' ISO 8601 (es. "13/03").
	parseDate?: (date: string) => number | Date;
	// Tick dell'asse tempo: "data" (default) = uno per punto dato, alla sua
	// posizione temporale; un numero = N tick equispaziati nel dominio.
	ticks?: "data" | number;
	// Formattazione etichetta di un tick temporale. Default: modalita' "data" =
	// stringa date grezza, modalita' numerica = toLocaleDateString.
	tickFormat?: (time: number) => string;
};

// Asse Y: `name` identifica la scala (di fatto obbligatorio: warnDev se nessuna
// serie combacia).
export type YAxisProps = AxisBaseProps & {
	// Dominio controllabile (S1b): `min`/`max` sovrascrivono il dominio
	// auto-calcolato ([0, max dei dati]). Utile per "entrare" in un intervallo di
	// valori (es. min=98, max=102). Con `max` esplicito il flatMax viene ignorato.
	// I valori fuori dominio sono clampati ai bordi. Solo grafici verticali
	// non-negativi, asse Y singolo (bar/line).
	min?: number;
	max?: number;
	// Zoom interattivo Y (S3): abilita lo zoom con la rotella del mouse sul
	// grafico (doppio click per resettare). `onZoomChange` notifica il dominio
	// corrente (null al reset). Stesso scope di min/max.
	zoomable?: boolean;
	onZoomChange?: (domain: [number, number] | null) => void;
	// Quanto zooma ogni tacca di rotella (default 1.15 = 15%). Piu' alto = piu'
	// aggressivo.
	zoomStep?: number;
	// Se >0, arrotonda gli estremi del dominio zoomato al multiplo indicato
	// (es. 1 = interi), per evitare valori con decimali.
	zoomSnap?: number;
};
