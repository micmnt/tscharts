import type {
	AngleDonutSerie,
	PieSerie,
	Serie,
	ThresholdSerie,
	TimeSerie,
} from "../types";

export const isDefined = (value: number | string | undefined | null) =>
	value !== null && value !== undefined;

export const warnDev = (message: string) => {
	if (process.env.NODE_ENV !== "production") {
		console.warn(`[tscharts] ${message}`);
	}
};

export const isTimeSerie = (serie: Serie): serie is TimeSerie =>
	serie.type === "line" ||
	serie.type === "bar" ||
	serie.type === "bar-stacked" ||
	serie.type === "group-bar";

export const isPieSerie = (serie: Serie): serie is PieSerie =>
	serie.type === "pie" || serie.type === "donut";

export const isAngleDonutSerie = (serie: Serie): serie is AngleDonutSerie =>
	serie.type === "angle-donut";

export const isThresholdSerie = (serie: Serie): serie is ThresholdSerie =>
	serie.type === "threshold";

export const isFunction = (
	value: unknown,
): value is (value: string) => void => {
	return typeof value === "function";
};

export const calculateFlatValue = (value: number) => {
	if (value === 0) return 0;
	const orderOfMagnitude = Math.floor(Math.log10(Math.abs(value)));

	if (orderOfMagnitude < 2) {
		const flatValue = Math.ceil(value / 10) * 10;
		return flatValue;
	}

	const multiplier = 10 ** orderOfMagnitude;

	return Math.ceil(value / multiplier) * multiplier;
};

export const normalizeBarRadius = (
	radius: number | undefined,
	dimension: number,
) => {
	if (!radius) return 0;

	if (dimension < radius / 2) return radius / 2;

	return radius;
};

export const getFirstValorizedElementIndex = (
	arr: {
		date: string;
		value: number | null;
	}[],
) => {
	return arr.findIndex((el: { date: string; value: number | null }) =>
		isDefined(el.value),
	);
};

export const trimZerosAndNullLinePath = (paths: string[]) => {
	const validPaths = [];

	let inEmptySequence = false;
	for (const pathIndex in paths) {
		if (paths[pathIndex] === "") {
			if (!inEmptySequence) {
				validPaths.push("*");
				inEmptySequence = true;
			}
		} else {
			if (validPaths.slice(-1)?.[0] === "*") {
				validPaths.pop();

				const movePath = paths[pathIndex]?.replace("L", "M");
				validPaths.push(movePath);
			} else {
				validPaths.push(paths[pathIndex]);
			}
			inEmptySequence = false;
		}
	}

	if (validPaths.slice(-1)?.[0] === "*") {
		validPaths.pop();
	}

	return validPaths;
};
