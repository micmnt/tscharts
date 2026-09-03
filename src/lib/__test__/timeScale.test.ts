import { describe, expect, it } from "vitest";
import type { ChartState, TimeSerie } from "../../types";
import { computeTimeDomain } from "../core/series";
import { generateDataPaths, generateGroupDataPaths } from "../core/timeSeries";

const parseDate = (d: string) => new Date(d).getTime();

const data = [
	{ date: "2024-01-01", value: 100 },
	{ date: "2024-01-02", value: 150 },
	{ date: "2024-01-31", value: 120 },
];

const chartXStart = 50;
const chartXEnd = 450;
const padding = 20;

const makeCtx = (
	scaleType?: "time",
	type: TimeSerie["type"] = "line",
	barWidth?: number,
) => {
	const serie: TimeSerie = { name: "s", type, uom: "€", data };
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
		barWidth,
	} as unknown as ChartState & { padding: number; barWidth?: number };
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

	it("computeTimeDomain copre tutte le serie temporali, barre incluse", () => {
		const line: TimeSerie = { name: "l", type: "line", uom: "", data };
		const bar: TimeSerie = {
			name: "b",
			type: "bar",
			uom: "",
			data: [{ date: "1999-01-01", value: 5 }],
		};
		const pie = {
			name: "p",
			type: "pie" as const,
			data: [{ name: "a", value: 1 }],
		};
		const domain = computeTimeDomain([line, bar, pie], parseDate);
		expect(domain).toEqual([parseDate("1999-01-01"), parseDate("2024-01-31")]);
	});
});

const barWidth = 30;

const barGeometry = (scaleType?: "time") => {
	const { serie, ctx } = makeCtx(scaleType, "bar", barWidth);
	const result = generateDataPaths(serie, ctx, "bar");

	const centers = (result?.dataPoints.get("s") ?? []).map(
		(p: number[]) => p[0],
	);
	const leftEdges = (result?.paths ?? []).map((d) => Number(d.split(" ")[1]));

	return { centers, leftEdges };
};

describe("timeScale — posizionamento temporale delle barre", () => {
	it('scaleType="time": le barre sono centrate sull\'istante del dato', () => {
		const { centers, leftEdges } = barGeometry("time");
		const r0 = chartXStart + padding;
		const r1 = chartXEnd - padding;
		const span = 30;

		expect(centers[0]).toBeCloseTo(r0, 6);
		expect(centers[1]).toBeCloseTo(r0 + (1 / span) * (r1 - r0), 6);
		expect(centers[2]).toBeCloseTo(r1, 6);

		centers.forEach((center, index) => {
			expect(leftEdges[index]).toBeCloseTo(center - barWidth / 2, 6);
		});

		const gap01 = centers[1] - centers[0];
		const gap12 = centers[2] - centers[1];
		expect(gap12).toBeGreaterThan(gap01 * 20);
	});

	it("default (band): le barre restano equidistanti come prima", () => {
		const { centers, leftEdges } = barGeometry();

		expect(centers[1] - centers[0]).toBeCloseTo(centers[2] - centers[1], 9);
		expect(leftEdges[0]).toBeCloseTo(chartXStart + padding / 2, 9);
	});

	it("scaleType=\"time\": il gruppo di barre e' centrato sull'istante", () => {
		const groupBarWidth = 20;
		const barGroupGap = 4;
		const series: TimeSerie[] = [
			{ name: "a", type: "group-bar", uom: "", data },
			{ name: "b", type: "group-bar", uom: "", data },
		];
		const ctx = {
			elements: series,
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
			scaleType: "time",
			parseDate,
			timeDomain: computeTimeDomain(series, parseDate),
			chartID: "x",
			svgRef: null,
			hoveredElement: null,
			padding,
			barWidth: groupBarWidth,
			barGroupGap,
		} as unknown as ChartState & { padding: number };

		const groupWidth = 2 * groupBarWidth + barGroupGap;
		const timePosition = chartXStart + padding;

		const leftEdgeOf = (serie: TimeSerie) =>
			Number(
				(generateGroupDataPaths(serie, ctx)?.paths ?? [])[0].split(" ")[1],
			);

		expect(leftEdgeOf(series[0])).toBeCloseTo(timePosition - groupWidth / 2, 6);
		expect(leftEdgeOf(series[1])).toBeCloseTo(
			timePosition - groupWidth / 2 + groupBarWidth + barGroupGap,
			6,
		);

		expect(leftEdgeOf(series[1]) + groupBarWidth).toBeCloseTo(
			timePosition + groupWidth / 2,
			6,
		);
	});

	it("barre e linea sullo stesso istante condividono la X", () => {
		const { serie: lineSerie, ctx: lineCtx } = makeCtx("time", "line");
		const lineX = (
			generateDataPaths(lineSerie, lineCtx, "line")?.dataPoints.get("s") ?? []
		).map((p: number[]) => p[0]);

		const { centers } = barGeometry("time");

		centers.forEach((center, index) => {
			expect(center).toBeCloseTo(lineX[index], 6);
		});
	});
});
