export type Point = { date: string; value: number };

export const movingAverage = (data: Point[], window: number): Point[] => {
	if (window <= 1) return data.map((p) => ({ ...p }));
	return data.map((p, i) => {
		const start = Math.max(0, i - window + 1);
		const slice = data.slice(start, i + 1);
		const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length;
		return { ...p, value: avg };
	});
};

export const cumulative = (data: Point[]): Point[] => {
	let sum = 0;
	return data.map((p) => {
		sum += p.value;
		return { ...p, value: sum };
	});
};

type ReduceKind = "sum" | "avg" | "min" | "max" | "count";

const reducers: Record<ReduceKind, (vals: number[]) => number> = {
	sum: (vals) => vals.reduce((s, v) => s + v, 0),
	avg: (vals) => vals.reduce((s, v) => s + v, 0) / vals.length,
	min: (vals) => Math.min(...vals),
	max: (vals) => Math.max(...vals),
	count: (vals) => vals.length,
};

export const aggregate = (
	data: Point[],
	opts: { by: (point: Point) => string; reduce?: ReduceKind },
): Point[] => {
	const reduce = reducers[opts.reduce ?? "sum"];
	const groups = new Map<string, number[]>();
	for (const point of data) {
		const key = opts.by(point);
		const bucket = groups.get(key);
		if (bucket) bucket.push(point.value);
		else groups.set(key, [point.value]);
	}
	return Array.from(groups, ([date, vals]) => ({ date, value: reduce(vals) }));
};

const formatEdge = (n: number) =>
	Number.isInteger(n) ? String(n) : n.toFixed(2);

export const bin = (
	data: Point[],
	opts: { size?: number; count?: number },
): Point[] => {
	if (data.length === 0) return [];
	const values = data.map((p) => p.value);
	const min = Math.min(...values);
	const max = Math.max(...values);

	let start: number;
	let size: number;
	let bins: number;

	if (opts.size && opts.size > 0) {
		size = opts.size;
		start = Math.floor(min / size) * size;
		bins = Math.max(1, Math.ceil((max - start) / size));
		if (start + bins * size <= max) bins += 1;
	} else {
		bins = Math.max(1, Math.floor(opts.count ?? 10));
		start = min;
		size = (max - min) / bins || 1;
	}

	const counts = new Array<number>(bins).fill(0);
	for (const v of values) {
		let idx = Math.floor((v - start) / size);
		if (idx < 0) idx = 0;
		if (idx >= bins) idx = bins - 1;
		counts[idx] += 1;
	}

	return counts.map((count, i) => {
		const lo = start + i * size;
		return { date: `${formatEdge(lo)}–${formatEdge(lo + size)}`, value: count };
	});
};
