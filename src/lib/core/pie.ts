import type { AngleDonutSerie, ChartState, PieSerie } from "../../types";
import { isDefined } from "../utils";
import { MIN_PIE_SLICE_LABEL_ANGLE } from "./constants";
import {
	generateDonutSlice,
	generatePieSlice,
	polarToCartesian,
} from "./primitives";

const OUTSIDE_LEADER_LENGTH = 14;
const OUTSIDE_HORIZONTAL_LEN = 18;
const OUTSIDE_TEXT_GAP = 4;
// Margine verticale riservato (oltre la leader line) quando le label sono esterne,
// per non farle sforare il bordo dell'SVG. Riduce il raggio in modalita' outside.
const OUTSIDE_LABEL_MARGIN = 12;

// Layout di una label esterna: ancoraggio sul raggio esterno lungo la bisettrice
// -> gomito -> tratto orizzontale, con lato (dx/sx) dal semicerchio. Condiviso da
// donut e pie.
const computeOutsideLabel = (
	centerX: number,
	centerY: number,
	radius: number,
	bisectorAngle: number,
	leaderLength: number,
) => {
	const p1 = polarToCartesian(centerX, centerY, radius, bisectorAngle);
	const p2 = polarToCartesian(
		centerX,
		centerY,
		radius + leaderLength,
		bisectorAngle,
	);
	const normalizedBisector = ((bisectorAngle % 360) + 360) % 360;
	const isRight = normalizedBisector < 180;
	const dir = isRight ? 1 : -1;
	const p3 = { x: p2.x + dir * OUTSIDE_HORIZONTAL_LEN, y: p2.y };
	return {
		p1,
		p2,
		p3,
		textX: p3.x + dir * OUTSIDE_TEXT_GAP,
		textY: p3.y,
		anchor: (isRight ? "start" : "end") as "start" | "end",
	};
};

// Anti-collisione delle label esterne: per ciascun lato (dx = "start", sx = "end")
// ordina per y e spinge verso il basso quelle troppo vicine, cosi' che due label
// consecutive distino almeno `minGap`. Aggiorna anche il punto finale della leader
// line (p3.y) perche' segua la label spostata. Funzione pura.
export const resolveOutsideLabelCollisions = <
	T extends {
		textY: number;
		anchor: "start" | "end";
		p3: { x: number; y: number };
	},
>(
	items: T[],
	minGap = 16,
): T[] => {
	const spread = (side: T[]): T[] => {
		const sorted = [...side].sort((a, b) => a.textY - b.textY);
		for (let i = 1; i < sorted.length; i++) {
			const minY = sorted[i - 1].textY + minGap;
			if (sorted[i].textY < minY) {
				sorted[i] = { ...sorted[i], textY: minY };
			}
		}
		return sorted.map((it) => ({ ...it, p3: { ...it.p3, y: it.textY } }));
	};

	const right = items.filter((it) => it.anchor === "start");
	const left = items.filter((it) => it.anchor === "end");
	return [...spread(right), ...spread(left)];
};

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

export const generateDonutPaths = (
	serie: PieSerie,
	ctx: ChartState & {
		padding: number;
		innerRadius?: number;
		gap?: number;
		sliceRadius?: number;
		labelPosition?: "inside" | "outside";
		leaderLine?: { length?: number; color?: string };
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

	const labelPosition = ctx.labelPosition ?? "inside";
	const leaderLength = ctx.leaderLine?.length ?? OUTSIDE_LEADER_LENGTH;
	const outsideReserve =
		labelPosition === "outside" ? leaderLength + OUTSIDE_LABEL_MARGIN : 0;

	const centerX = width / 2;
	const centerY = height / 2 - padding;
	const radius = (height - 2 * padding) / 2 - outsideReserve;
	const innerRadius = radius - (ctx.innerRadius ?? radius / 2);
	const halfGap = (ctx.gap ?? 0) / 2;
	const sliceRadius = ctx.sliceRadius ?? 0;
	const outsideLabels = new Map();

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

		const gappedStart = startAngle + halfGap;
		const gappedEnd = normalizedValueAngle - halfGap;
		const [sliceStart, sliceEnd] =
			gappedEnd > gappedStart
				? [gappedStart, gappedEnd]
				: [startAngle, normalizedValueAngle];

		const path = generateDonutSlice(
			centerX,
			centerY,
			radius,
			innerRadius,
			sliceStart,
			sliceEnd,
			sliceRadius,
		);

		const sliceValue = valueAngle - startAngle;
		const bisectorAngle = sliceValue / 2 + startAngle;

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

		if (labelPosition === "outside") {
			outsideLabels.set(
				serieEl.name,
				computeOutsideLabel(
					centerX,
					centerY,
					radius,
					bisectorAngle,
					leaderLength,
				),
			);
		}

		return path;
	});

	if (isDefined(centerValue)) {
		const centerPoint = { x: centerX, y: centerY };
		return { paths, dataPoints, outsideLabels, centerPoint };
	}

	return { paths, dataPoints, outsideLabels };
};

export const generatePiePaths = (
	serie: PieSerie,
	ctx: ChartState & {
		padding: number;
		labelPosition?: "inside" | "outside";
		leaderLine?: { length?: number; color?: string };
	},
) => {
	const serieData = serie.data;

	const dataPoints = new Map();

	const pieTotalValue = serieData.reduce(
		(acc, dataEl) => (acc += dataEl.value),
		0,
	);

	const { width, height, padding } = ctx;

	const labelPosition = ctx.labelPosition ?? "inside";
	const leaderLength = ctx.leaderLine?.length ?? OUTSIDE_LEADER_LENGTH;
	const outsideReserve =
		labelPosition === "outside" ? leaderLength + OUTSIDE_LABEL_MARGIN : 0;

	const centerX = width / 2;
	const centerY = height / 2 - 1.5 * padding;
	const radius = (height - 3 * padding) / 2 - outsideReserve;
	const outsideLabels = new Map();

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

		if (labelPosition === "outside") {
			outsideLabels.set(
				serieEl.name,
				computeOutsideLabel(
					centerX,
					centerY,
					radius,
					bisectorAngle,
					leaderLength,
				),
			);
		}

		return path;
	});

	return { paths, dataPoints, outsideLabels };
};
