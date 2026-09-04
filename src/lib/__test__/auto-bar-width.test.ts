import { describe, expect, it } from "vitest";
import type { ChartState, Serie, TimeSerie } from "../../types";
import { computeTimeDomain, resolveBarWidth } from "../core";
import type { GlobalConfig } from "../globalConfig";

const padding = 20;
const chartXStart = 50;
const chartXEnd = 450;
const chartYEnd = 360;
const RATIO = 0.7;

const parseDate = (d: string) => new Date(d).getTime();

const barSerie = (name: string, count: number): TimeSerie => ({
	name,
	type: "bar",
	uom: "",
	data: Array.from({ length: count }, (_, index) => ({
		date: `d${index}`,
		value: 10,
	})),
});

const makeCtx = (
	elements: Serie[],
	globalConfig?: GlobalConfig,
	extra?: Partial<ChartState>,
) =>
	({
		elements,
		globalConfig,
		chartXStart,
		chartXEnd,
		chartYEnd,
		chartYMiddle: 180,
		width: 500,
		height: 400,
		...extra,
	}) as unknown as ChartState;

const bandStep = (count: number) => (chartXEnd - chartXStart) / count;

describe("resolveBarWidth", () => {
	it("senza barWidth resta il default storico (padding)", () => {
		const ctx = makeCtx([barSerie("a", 5)]);
		expect(resolveBarWidth(ctx, padding)).toBe(padding);
	});

	it("con un numero lo restituisce invariato", () => {
		const ctx = makeCtx([barSerie("a", 5)], { barWidth: 32 });
		expect(resolveBarWidth(ctx, padding)).toBe(32);
	});

	it('"auto": la larghezza e\' una frazione del passo della categoria', () => {
		const ctx = makeCtx([barSerie("a", 5)], { barWidth: "auto" });
		expect(resolveBarWidth(ctx, padding)).toBeCloseTo(bandStep(5) * RATIO, 6);
	});

	it('"auto": piu categorie, barre piu strette', () => {
		const poche = resolveBarWidth(
			makeCtx([barSerie("a", 4)], { barWidth: "auto" }),
			padding,
		);
		const molte = resolveBarWidth(
			makeCtx([barSerie("a", 40)], { barWidth: "auto" }),
			padding,
		);

		expect(molte).toBeLessThan(poche);
		expect(molte).toBeCloseTo(bandStep(40) * RATIO, 6);
	});

	it('"auto": le barre non si sovrappongono mai (larghezza < passo)', () => {
		for (const count of [1, 3, 10, 25, 60, 200]) {
			const width = resolveBarWidth(
				makeCtx([barSerie("a", count)], { barWidth: "auto" }),
				padding,
			);
			expect(width).toBeLessThanOrEqual(bandStep(count));
		}
	});

	it('"auto" con group-bar: il gruppo intero occupa la frazione del passo', () => {
		const a: TimeSerie = { ...barSerie("a", 5), type: "group-bar" };
		const b: TimeSerie = { ...barSerie("b", 5), type: "group-bar" };
		const barGroupGap = 4;

		const width = resolveBarWidth(
			makeCtx([a, b], { barWidth: "auto", barGroupGap }),
			padding,
		);

		const groupWidth = 2 * width + barGroupGap;
		expect(groupWidth).toBeCloseTo(bandStep(5) * RATIO, 6);
	});

	it('"auto" su scala tempo: usa la distanza minima fra due date', () => {
		const serie: TimeSerie = {
			name: "a",
			type: "bar",
			uom: "",
			data: [
				{ date: "2024-01-01", value: 10 },
				{ date: "2024-01-02", value: 10 },
				{ date: "2024-01-31", value: 10 },
			],
		};

		const ctx = makeCtx([serie], { barWidth: "auto" }, {
			scaleType: "time",
			parseDate,
			timeDomain: computeTimeDomain([serie], parseDate),
		} as Partial<ChartState>);

		const range = chartXEnd - padding - (chartXStart + padding);
		const minGapPx = range / 30;

		expect(resolveBarWidth(ctx, padding)).toBeCloseTo(minGapPx * RATIO, 6);
	});

	it('"auto" orizzontale: il passo si misura sull\'asse Y', () => {
		const ctx = makeCtx([barSerie("a", 8)], { barWidth: "auto" }, {
			horizontal: true,
		} as Partial<ChartState>);

		expect(resolveBarWidth(ctx, padding)).toBeCloseTo(
			((chartYEnd - padding) / 8) * RATIO,
			6,
		);
	});
});
