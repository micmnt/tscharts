import type { AngleDonutSerie, ChartState, PieSerie } from "../../types";
import { isDefined } from "../utils";
import { MIN_PIE_SLICE_LABEL_ANGLE } from "./constants";
import {
	generateDonutSlice,
	generatePieSlice,
	polarToCartesian,
} from "./primitives";

// Funzione che genera i path per una serie di un grafico a ciambella aperto con un angolo
export const generateAngleDonutPaths = (
	serie: AngleDonutSerie,
	ctx: ChartState & {
		padding: number;
		innerRadius?: number;
		angle?: number;
		showTrack?: boolean;
		centerElement?: {
			value?: string;
			valueColor?: string;
			valueSize?: number;
			uom?: string;
			uomColor?: string;
			uomSize?: number;
			uomDx?: number;
			label?: string;
			labelColor?: string;
			labelSize?: number;
			labelDy?: number;
		};
	},
) => {
	const serieData = serie.data;

	const {
		width,
		height,
		padding,
		centerElement,
		angle,
		showTrack = false,
	} = ctx;

	const { value: centerValue } = centerElement ?? {};

	const centerX = width / 2;
	const centerY = height / 2 - padding;
	const radius = (height - 2 * padding) / 2;

	const ringThickness = ctx.innerRadius ?? radius / 2;

	const labelWidth = radius * 0.6;
	const labelGap = padding / 2;

	const paths = serieData.map((serieEl, serieElIndex) => {
		const maxValue = isDefined(serieEl.maxValue)
			? serieEl.maxValue
			: serieEl.value;
		const startAngle = 0;

		const normalizedAngle = isDefined(angle) ? Number(angle) : 360;
		const valueAngle = (Number(serieEl.value) * normalizedAngle) / maxValue;

		const normalizedValueAngle = valueAngle >= 360 ? 359.9 : valueAngle;

		const newRadius = radius - (ringThickness + padding / 8) * serieElIndex;
		const newInnerRadius = newRadius - ringThickness;

		let shadowPath = "";

		if (showTrack && isDefined(serieEl.maxValue)) {
			shadowPath = generateDonutSlice(
				centerX,
				centerY,
				newRadius,
				newInnerRadius,
				startAngle,
				normalizedAngle,
			);
		}

		const path = generateDonutSlice(
			centerX,
			centerY,
			newRadius,
			newInnerRadius,
			startAngle,
			normalizedValueAngle,
		);

		// X quasi costante per tutti gli anelli (poco a sinistra del centro,
		// non del bordo esterno del singolo ring - altrimenti si crea una
		// scaletta): la label si sovrappone leggermente all'inizio
		// dell'arco. Y ancorata a dove il ring "inizia" (ore 12, angolo 0)
		// al proprio raggio medio, cosi' ogni label resta all'altezza del
		// proprio anello.
		const ringMidRadius = (newRadius + newInnerRadius) / 2;
		const ringStartY = polarToCartesian(centerX, centerY, ringMidRadius, 0).y;

		const labelElement = {
			x: centerX - labelGap - labelWidth,
			y: ringStartY - ringThickness / 2,
			width: labelWidth,
			height: ringThickness,
		};

		return { shadowPath, path, labelElement };
	});

	if (isDefined(centerValue)) {
		const centerPoint = { x: centerX, y: centerY };

		return { paths, centerPoint };
	}
	return { paths };
};

// Funzione che genera i path per una serie di un grafico a ciambella
export const generateDonutPaths = (
	serie: PieSerie,
	ctx: ChartState & {
		padding: number;
		innerRadius?: number;
		centerElement?: {
			value?: string;
			valueColor?: string;
			valueSize?: number;
			uom?: string;
			uomColor?: string;
			uomSize?: number;
			uomDx?: number;
			label?: string;
			labelColor?: string;
			labelSize?: number;
			labelDy?: number;
		};
	},
) => {
	const serieData = serie.data;

	const dataPoints = new Map();

	const donutTotalValue = serieData.reduce(
		(acc, dataEl) => acc + dataEl.value,
		0,
	);

	const { width, height, padding, centerElement } = ctx;

	const { value: centerValue } = centerElement ?? {};

	const centerX = width / 2;
	const centerY = height / 2 - padding;
	const radius = (height - 2 * padding) / 2;
	const innerRadius = radius - (ctx.innerRadius ?? radius / 2);

	const startAngles = serieData.map(
		(serieEl) => (Number(serieEl.value) * 360) / Number(donutTotalValue),
	);

	const paths = serieData.map((serieEl, serieElIndex) => {
		const startAngle =
			serieElIndex > 0
				? startAngles.slice(0, serieElIndex).reduce((acc, el) => acc + el, 0)
				: 0;

		const valueAngle =
			(Number(serieEl.value) * 360) / Number(donutTotalValue) + startAngle;

		const normalizedValueAngle = valueAngle >= 360 ? 359.9 : valueAngle;

		const path = generateDonutSlice(
			centerX,
			centerY,
			radius,
			innerRadius,
			startAngle,
			normalizedValueAngle,
		);

		const sliceValue = valueAngle - startAngle;
		const bisectorAngle = sliceValue / 2 + startAngle;
		// Meta' dello spessore dell'anello (tra innerRadius e radius), non
		// radius/2: per un donut con innerRadius grande, radius/2 cade vicino
		// al bordo interno invece che al centro della fascia colorata.
		const labelRadius = (radius + innerRadius) / 2;
		const bisectorPoint = polarToCartesian(
			centerX,
			centerY,
			labelRadius,
			bisectorAngle,
		);

		const labelPoint = { x: bisectorPoint.x, y: bisectorPoint.y };

		if (sliceValue >= MIN_PIE_SLICE_LABEL_ANGLE) {
			dataPoints.set(serieEl.name, labelPoint);
		}

		return path;
	});

	if (isDefined(centerValue)) {
		const centerPoint = { x: centerX, y: centerY };
		return { paths, dataPoints, centerPoint };
	}

	return { paths, dataPoints };
};

// Funzione che genera i path per una serie di un grafico a torta
export const generatePiePaths = (
	serie: PieSerie,
	ctx: ChartState & { padding: number },
) => {
	const serieData = serie.data;

	const dataPoints = new Map();

	const pieTotalValue = serieData.reduce(
		(acc, dataEl) => (acc += dataEl.value),
		0,
	);

	const { width, height, padding } = ctx;

	const centerX = width / 2;
	const centerY = height / 2 - 1.5 * padding;
	const radius = (height - 3 * padding) / 2;

	const startAngles = serieData.map(
		(serieEl) => (Number(serieEl.value) * 360) / Number(pieTotalValue),
	);

	const paths = serieData.map((serieEl, serieElIndex) => {
		const startAngle =
			serieElIndex > 0
				? startAngles.slice(0, serieElIndex).reduce((acc, el) => (acc += el), 0)
				: 0;

		const valueAngle =
			(Number(serieEl.value) * 360) / Number(pieTotalValue) + startAngle;

		const normalizedValueAngle = valueAngle >= 360 ? 359.9 : valueAngle;

		const path = generatePieSlice(
			centerX,
			centerY,
			radius,
			startAngle,
			normalizedValueAngle,
		);

		const sliceValue = valueAngle - startAngle;
		const bisectorAngle = sliceValue / 2 + startAngle;
		const labelRadius = radius / 2;
		const bisectorPoint = polarToCartesian(
			centerX,
			centerY,
			labelRadius,
			bisectorAngle,
		);

		const labelPoint = { x: bisectorPoint.x, y: bisectorPoint.y };

		if (sliceValue >= MIN_PIE_SLICE_LABEL_ANGLE) {
			dataPoints.set(serieEl.name, labelPoint);
		}

		return path;
	});

	return { paths, dataPoints };
};
