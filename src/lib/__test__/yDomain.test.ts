import { describe, expect, it } from "vitest";
import type { ChartState, TimeSerie } from "../../types";
import { generateDataPaths } from "../core/timeSeries";

const chartYEnd = 360;
const padding = 20;

const makeCtx = (opts?: { yMin?: number; yMax?: number }) => {
	const serie: TimeSerie = {
		name: "s",
		type: "line",
		uom: "€",
		data: [
			{ date: "a", value: 98 },
			{ date: "b", value: 100 },
			{ date: "c", value: 102 },
		],
	};
	const ctx = {
		elements: [serie],
		chartXStart: 47.5,
		chartXEnd: 613.25,
		chartYEnd,
		chartYMiddle: 180,
		width: 640,
		height: 400,
		flatMax: true,
		negative: false,
		horizontal: false,
		globalConfig: {},
		chartID: "x",
		svgRef: null,
		hoveredElement: null,
		padding,
		yMin: opts?.yMin,
		yMax: opts?.yMax,
	} as unknown as ChartState & { padding: number };
	return { serie, ctx };
};

const ys = (opts?: { yMin?: number; yMax?: number }) => {
	const { serie, ctx } = makeCtx(opts);
	const dp = generateDataPaths(serie, ctx, "line")?.dataPoints.get("s") ?? [];
	return dp.map((p: number[]) => p[1]);
};

describe("yDomain — dominio Y controllabile (min/max)", () => {
	it("default: valori 98-102 schiacciati in alto (dominio [0, max-auto])", () => {
		const y = ys();
		const spread = Math.max(...y) - Math.min(...y);

		expect(spread).toBeLessThan(20);
	});

	it("min=98 max=102: la line si distribuisce su tutta l'altezza", () => {
		const y = ys({ yMin: 98, yMax: 102 });

		expect(y[0]).toBeCloseTo(chartYEnd, 6);
		expect(y[2]).toBeCloseTo(padding, 6);
		expect(y[1]).toBeCloseTo((chartYEnd + padding) / 2, 6);
		const spread = Math.max(...y) - Math.min(...y);
		expect(spread).toBeCloseTo(chartYEnd - padding, 6);
	});

	it("clamp: valori oltre max finiscono sul bordo alto", () => {
		const { serie, ctx } = makeCtx({ yMin: 98, yMax: 100 });

		const dp = generateDataPaths(serie, ctx, "line")?.dataPoints.get("s") ?? [];
		const y = dp.map((p: number[]) => p[1]);
		expect(y[2]).toBeCloseTo(padding, 6);
		expect(y[1]).toBeCloseTo(padding, 6);
	});
});
