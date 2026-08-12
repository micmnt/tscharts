import { describe, expect, it } from "vitest";
import type { ChartState, TimeSerie } from "../../types";
import { computeTimeDomain } from "../core/series";
import { generateDataPaths } from "../core/timeSeries";

const parseDate = (d: string) => new Date(d).getTime();

const data = [
	{ date: "2024-01-01", value: 100 },
	{ date: "2024-01-02", value: 150 },
	{ date: "2024-01-31", value: 120 },
];

const chartXStart = 50;
const chartXEnd = 450;
const padding = 20;

const makeCtx = (scaleType?: "time") => {
	const serie: TimeSerie = { name: "s", type: "line", uom: "€", data };
	const timeDomain =
		scaleType === "time" ? computeTimeDomain([serie], parseDate) : undefined;
	const ctx = {
		elements: [serie],
		chartXStart,
		chartXEnd,
		chartYEnd: 360,
		chartYMiddle: 180,
		width: 500,
		height: 400,
		flatMax: true,
		negative: false,
		horizontal: false,
		globalConfig: {},
		scaleType,
		parseDate,
		timeDomain,
		chartID: "x",
		svgRef: null,
		hoveredElement: null,
		padding,
	} as unknown as ChartState & { padding: number };
	return { serie, ctx };
};

const xs = (scaleType?: "time") => {
	const { serie, ctx } = makeCtx(scaleType);
	const dp = generateDataPaths(serie, ctx, "line")?.dataPoints.get("s") ?? [];
	return dp.map((p: number[]) => p[0]);
};

describe("timeScale — posizionamento temporale del ramo line", () => {
	it('scaleType="time": X proporzionali al tempo (non all\'indice)', () => {
		const x = xs("time");
		const r0 = chartXStart + padding;
		const r1 = chartXEnd - padding;
		const span = 30;

		expect(x[0]).toBeCloseTo(r0, 6);
		expect(x[2]).toBeCloseTo(r1, 6);

		expect(x[1]).toBeCloseTo(r0 + (1 / span) * (r1 - r0), 6);

		const gap01 = x[1] - x[0];
		const gap12 = x[2] - x[1];
		expect(gap12).toBeGreaterThan(gap01 * 20);
	});

	it("default (band, niente scaleType): X equidistanti come prima", () => {
		const x = xs();
		const d1 = x[1] - x[0];
		const d2 = x[2] - x[1];
		expect(d1).toBeCloseTo(d2, 9);
	});

	it("computeTimeDomain considera solo le serie line", () => {
		const line: TimeSerie = { name: "l", type: "line", uom: "", data };
		const bar: TimeSerie = {
			name: "b",
			type: "bar",
			uom: "",
			data: [{ date: "1999-01-01", value: 5 }],
		};
		const domain = computeTimeDomain([line, bar], parseDate);
		expect(domain).toEqual([parseDate("2024-01-01"), parseDate("2024-01-31")]);
	});
});
