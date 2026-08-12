export type BandScale = {
	position: (index: number) => number;

	invert: (x: number) => number;

	step: number;

	base: number;
};

export const createBandScale = ({
	start,
	end,
	count,
	firstOffset = 0,
}: {
	start: number;
	end: number;
	count: number;
	firstOffset?: number;
}): BandScale => {
	const step = (end - start) / (count || 1);
	const base = start + firstOffset;

	return {
		step,
		base,
		position: (index: number) => step * index + base,
		invert: (x: number) => Math.round((x - base) / step),
	};
};

export type LinearScale = {
	scale: (value: number) => number;

	invert: (px: number) => number;

	ticks: (count: number) => number[];
	domain: readonly [number, number];
};

export const createLinearScale = ({
	domain,
	range,
}: {
	domain: readonly [number, number];
	range: readonly [number, number];
}): LinearScale => {
	const [d0, d1] = domain;
	const [r0, r1] = range;

	const dspan = d1 - d0 || 1;
	const rspan = r1 - r0;

	return {
		domain,
		scale: (value: number) => r0 + ((value - d0) / dspan) * rspan,
		invert: (px: number) => d0 + ((px - r0) / (rspan || 1)) * dspan,
		ticks: (count: number) => {
			const n = Math.max(1, Math.floor(count));
			if (n === 1) return [d0];
			return Array.from({ length: n }, (_, i) => d0 + (dspan * i) / (n - 1));
		},
	};
};

export type TimeScale = {
	position: (time: number) => number;
	invert: (x: number) => number;
	ticks: (count: number) => number[];
	domain: readonly [number, number];
};

export const createTimeScale = ({
	domain,
	range,
}: {
	domain: readonly [number, number];
	range: readonly [number, number];
}): TimeScale => {
	const lin = createLinearScale({ domain, range });
	return {
		domain: lin.domain,
		position: lin.scale,
		invert: lin.invert,
		ticks: lin.ticks,
	};
};

export const getChartTimeScale = (ctx: {
	timeDomain?: readonly [number, number];
	chartXStart: number;
	chartXEnd: number;
	padding: number;
}): TimeScale | null => {
	if (!ctx.timeDomain) return null;
	return createTimeScale({
		domain: ctx.timeDomain,
		range: [ctx.chartXStart + ctx.padding, ctx.chartXEnd - ctx.padding],
	});
};

export const snapDomain = (
	domain: readonly [number, number],
	snap: number,
	baseDomain: readonly [number, number],
): [number, number] => {
	if (!snap || snap <= 0) return [domain[0], domain[1]];
	const [baseMin, baseMax] = baseDomain;
	let min = Math.round(domain[0] / snap) * snap;
	let max = Math.round(domain[1] / snap) * snap;
	if (max - min < snap) max = min + snap;
	min = Math.max(baseMin, min);
	max = Math.min(baseMax, max);
	return max > min ? [min, max] : [domain[0], domain[1]];
};

export const computeWheelZoom = ({
	domain,
	baseDomain,
	value,
	deltaY,
	zoomStep = 1.15,
	minSpanRatio = 0.02,
	snap,
}: {
	domain: readonly [number, number];
	baseDomain: readonly [number, number];
	value: number;
	deltaY: number;

	zoomStep?: number;
	minSpanRatio?: number;

	snap?: number;
}): [number, number] => {
	const [cMin, cMax] = domain;
	const [baseMin, baseMax] = baseDomain;
	const span = cMax - cMin;
	const baseSpan = baseMax - baseMin || 1;

	const factor = zoomStep ** (deltaY / 100);
	const minSpan = baseSpan * minSpanRatio;
	const newSpan = Math.min(baseSpan, Math.max(minSpan, span * factor));

	const frac = span === 0 ? 0.5 : (value - cMin) / span;
	let newMin = value - frac * newSpan;
	let newMax = newMin + newSpan;

	if (newMin < baseMin) {
		newMin = baseMin;
		newMax = baseMin + newSpan;
	} else if (newMax > baseMax) {
		newMax = baseMax;
		newMin = baseMax - newSpan;
	}

	if (snap && snap > 0) {
		let sMin = Math.round(newMin / snap) * snap;
		let sMax = Math.round(newMax / snap) * snap;
		if (sMax - sMin < snap) sMax = sMin + snap;
		sMin = Math.max(baseMin, sMin);
		sMax = Math.min(baseMax, sMax);
		if (sMax > sMin) {
			newMin = sMin;
			newMax = sMax;
		}
	}

	return [newMin, newMax];
};

export const getChartYScale = ({
	min = 0,
	max,
	chartYEnd,
	padding,
}: {
	min?: number;
	max: number;
	chartYEnd: number;
	padding: number;
}): LinearScale => {
	const span = max - min || 1;
	const dim = chartYEnd - padding || 1;
	const clamp = (v: number) => (v < min ? min : v > max ? max : v);

	return {
		domain: [min, max],

		scale: (value: number) => chartYEnd - (dim * (clamp(value) - min)) / span,
		invert: (px: number) => min + ((chartYEnd - px) * span) / dim,
		ticks: (count: number) => {
			const n = Math.max(1, Math.floor(count));
			if (n === 1) return [min];
			return Array.from({ length: n }, (_, i) => min + (span * i) / (n - 1));
		},
	};
};
