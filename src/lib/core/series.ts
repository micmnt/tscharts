import type {
	Serie,
	ThresholdSerie,
	TimeSerie,
	TimeSerieEl,
} from "../../types";
import {
	calculateFlatValue,
	isThresholdSerie,
	isTimeSerie,
	warnDev,
} from "../utils";

export const normalizeTime = (
	date: string,
	parseDate?: (d: string) => number | Date,
): number => {
	const value = parseDate ? parseDate(date) : new Date(date).getTime();
	return value instanceof Date ? value.getTime() : value;
};

export const computeTimeDomain = (
	elements: Serie[],
	parseDate?: (date: string) => number | Date,
): [number, number] | undefined => {
	const times: number[] = [];

	for (const el of elements) {
		if (el.type !== "line") continue;
		for (const point of el.data) {
			const time = normalizeTime(point.date, parseDate);
			if (Number.isNaN(time)) {
				warnDev(
					`<XAxis scaleType="time">: data "${point.date}" non interpretabile (parseDate ha restituito NaN). Il punto verra' ignorato nel dominio.`,
				);
				continue;
			}
			times.push(time);
		}
	}

	if (times.length === 0) return undefined;
	return [Math.min(...times), Math.max(...times)];
};

export const getSeriesMissingYAxis = (
	elements: Serie[],
	yAxisNames: string[],
): TimeSerie[] => {
	if (yAxisNames.length === 0) return [];
	return elements.filter(
		(el): el is TimeSerie =>
			(el.type === "bar" || el.type === "line") &&
			!yAxisNames.includes(el.axisName ?? el.name),
	);
};

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

export const getSeriesByAxisName = (
	elements: Serie[],
	axisName: string,
): TimeSerieEl[][] => {
	if (!elements || !axisName) return [];

	const axisSeries = elements
		.filter(
			(el): el is TimeSerie =>
				(el.type === "line" || el.type === "bar") &&
				(el.axisName === axisName || el.name === axisName),
		)
		.map((el) => el.data);
	return axisSeries;
};

export const getSerieAssociatedThresholds = (
	elements: Serie[],
	axisName: string,
) => {
	if (!elements || !axisName) return [];

	const seriesThresholds = elements
		.filter(
			(el): el is ThresholdSerie =>
				isThresholdSerie(el) && el.axisName === axisName,
		)
		.map((el) => ({ date: "null", value: el.data }));

	return seriesThresholds;
};

export const normalizeSerieElementsData = (elements: Serie[]) => {
	if (!elements) return [];

	const thresholdsSeries = elements.filter(isThresholdSerie).map((el) => ({
		...el,
		data: [{ date: "null", value: el.data }],
	}));

	const lineOrBarSeries = elements.filter(isTimeSerie);

	return [...lineOrBarSeries, ...thresholdsSeries];
};

export const calculateStackedSeriesMax = (series: TimeSerie[]) => {
	const serieLabels = series?.[0].data.map((el) => el.date) ?? [];

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

export const getEffectiveMaxValue = (
	flatMax: boolean | undefined,
	rawMaxValue: number,
) => (flatMax ? calculateFlatValue(rawMaxValue) : rawMaxValue);

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
