import type {
	Serie,
	ThresholdSerie,
	TimeSerie,
	TimeSerieEl,
} from "../../types";
import { calculateFlatValue, isThresholdSerie, isTimeSerie } from "../utils";

// Serie time-serie (bar/line/bar-stacked/group-bar) la cui chiave d'asse
// (axisName ?? name) non corrisponde ad alcun asse Y renderizzato: verrebbero
// disegnate su una scala isolata, basata sul proprio max, che nessun asse
// mostra -> grafico fuorviante (R12). Se non ci sono assi Y non si segnala
// nulla: un grafico volutamente senza assi non e' un errore.
export const getSeriesMissingYAxis = (
	elements: Serie[],
	yAxisNames: string[],
): TimeSerie[] => {
	if (yAxisNames.length === 0) return [];
	return elements.filter(
		(el): el is TimeSerie =>
			isTimeSerie(el) && !yAxisNames.includes(el.axisName ?? el.name),
	);
};

// Funzione che calcola il valore massimo di una serie
export const getTimeSerieMaxValue = (serie: TimeSerieEl[] = []) => {
	if (serie?.length > 0) {
		return Math.max(
			...serie
				.filter((el) => el !== null)
				.map((serieEl) => Math.abs(serieEl.value)),
		);
	}

	return 0;
};

// Funzione che prende in ingresso le serie del grafico e ritorna le serie a linea e a barre presenti associate ad un determinato asse
export const getSeriesByAxisName = (
	elements: Serie[],
	axisName: string,
): TimeSerieEl[][] => {
	if (!elements || !axisName) return [];
	// Prendo i valori delle serie presenti associate all'asse da graficare
	const axisSeries = elements
		.filter(
			(el): el is TimeSerie =>
				(el.type === "line" || el.type === "bar") &&
				(el.axisName === axisName || el.name === axisName),
		)
		.map((el) => el.data);
	return axisSeries;
};

// Funzione che prende in ingresso le serie del grafico e ritorna le soglie presenti associate ad un determinato asse
export const getSerieAssociatedThresholds = (
	elements: Serie[],
	axisName: string,
) => {
	if (!elements || !axisName) return [];
	// Prendo i valori delle eventuali soglie presenti associate all'asse della serie da graficare
	const seriesThresholds = elements
		.filter(
			(el): el is ThresholdSerie =>
				isThresholdSerie(el) && el.axisName === axisName,
		)
		.map((el) => ({ date: "null", value: el.data }));

	return seriesThresholds;
};

// Funzione che normalizza ctx.elements[i].data in TimeSerieEl[]
export const normalizeSerieElementsData = (elements: Serie[]) => {
	if (!elements) return [];

	// Prendo le serie che sono delle soglie, e le riporto alla stessa forma
	// di data (TimeSerieEl[]) delle serie a linea/barre per poterle unire.
	const thresholdsSeries = elements.filter(isThresholdSerie).map((el) => ({
		...el,
		data: [{ date: "null", value: el.data }],
	}));

	const lineOrBarSeries = elements.filter(isTimeSerie);

	return [...lineOrBarSeries, ...thresholdsSeries];
};

// Funzione che calcola il massimo sommando i massimi delle serie da mostrare come colonne stacked
export const calculateStackedSeriesMax = (series: TimeSerie[]) => {
	// Prendo le labels per costruire una serie unificata
	const serieLabels = series?.[0].data.map((el) => el.date) ?? [];
	// Creo una serie dove per ogni label c'è la somma dei valori di tutte le serie per quella label
	const unifiedSerie = serieLabels.map((label) => {
		const seriesElements = series.flatMap((serie) =>
			serie.data.find((el) => el.date === label),
		);
		const value = (seriesElements as TimeSerieEl[]).reduce((acc, el) => {
			acc += el.value ?? 0;
			return acc;
		}, 0);

		return { date: label, value };
	});

	return getTimeSerieMaxValue((unifiedSerie as TimeSerieEl[]) ?? []);
};

// Funzione condivisa dalle 6 varianti di generate*DataPaths: applica
// l'arrotondamento "pulito" (flatMax) al valore massimo grezzo, se richiesto
// dal tema/config del grafico. Stesso pattern `ctx.flatMax ? ... : ...`
// ripetuto identico in tutte e 6 prima di questa estrazione (D3).
export const getEffectiveMaxValue = (
	flatMax: boolean | undefined,
	rawMaxValue: number,
) => (flatMax ? calculateFlatValue(rawMaxValue) : rawMaxValue);

// Funzione condivisa da generateDataPaths, generateNegativeDataPaths e
// generateHorizontalDataPaths (le tre varianti "senza accumulo"): calcola
// il valore massimo tra i punti della serie sullo stesso asse e le soglie
// associate. Stesso blocco ripetuto identico in tutte e tre prima di questa
// estrazione (D3). Le varianti stacked/group non lo usano: calcolano il
// massimo diversamente (calculateStackedSeriesMax, somma tra serie del
// gruppo), quindi non fa parte di questa condivisione.
export const getSerieMaxValueForAxis = (
	elements: Serie[],
	serie: TimeSerie,
) => {
	const axisSeries = getSeriesByAxisName(
		elements,
		serie.axisName ?? serie.name,
	);
	const flatAxisSeriesData = axisSeries.flat();
	const seriesThresholds = getSerieAssociatedThresholds(elements, serie.name);

	return getTimeSerieMaxValue([
		...(flatAxisSeriesData ?? []),
		...(seriesThresholds ?? []),
	]);
};
