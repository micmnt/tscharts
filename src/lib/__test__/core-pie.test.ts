import { describe, expect, it } from "vitest";
import {
	generateAngleDonutPaths,
	generateDonutPaths,
	generateDonutSlice,
	generatePiePaths,
	generatePieSlice,
} from "../core";

const baseCtx = { width: 200, height: 200, padding: 10 };

describe("generatePiePaths", () => {
	it("due fette uguali (50/50) ottengono esattamente 180 gradi ciascuna", () => {
		const serie = {
			name: "p1",
			type: "pie",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const result = generatePiePaths(serie, baseCtx);

		// centerX=100, centerY=height/2-1.5*padding=85, radius=(height-3*padding)/2=85.
		// Fette uguali quindi gli angoli attesi (0-180, 180-360) sono noti senza
		// doverli calcolare a mano: confronto diretto con la primitiva.
		expect(result?.paths[0]).toBe(generatePieSlice(100, 85, 85, 0, 180));
		// 360 clampato a 359.9 dalla funzione, per evitare un arco degenere.
		expect(result?.paths[1]).toBe(generatePieSlice(100, 85, 85, 180, 359.9));
	});

	it("una fetta sotto i 31 gradi non genera un dataPoint per la label, una sopra si'", () => {
		const serie = {
			name: "p1",
			type: "pie",
			data: [
				{ name: "small", value: 5 }, // 5% * 360 = 18 gradi
				{ name: "big", value: 95 }, // 342 gradi
			],
		};
		const result = generatePiePaths(serie, baseCtx);

		expect(result?.dataPoints.has("small")).toBe(false);
		expect(result?.dataPoints.has("big")).toBe(true);
	});

	it("un'unica fetta al 100% chiude il cerchio, clampata a 359.9 invece di 360", () => {
		const serie = {
			name: "p1",
			type: "pie",
			data: [{ name: "solo", value: 10 }],
		};
		const result = generatePiePaths(serie, baseCtx);

		expect(result?.paths[0]).toBe(generatePieSlice(100, 85, 85, 0, 359.9));
	});
});

describe("generateDonutPaths", () => {
	it("due fette uguali (50/50) ottengono esattamente 180 gradi ciascuna", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "a", value: 50 },
				{ name: "b", value: 50 },
			],
		};
		const result = generateDonutPaths(serie, baseCtx);

		// centerX=100, centerY=height/2-padding=90, radius=(height-2*padding)/2=90,
		// innerRadius=radius-radius/2=45 (nessun innerRadius custom in ctx).
		expect(result?.paths[0]).toBe(generateDonutSlice(100, 90, 90, 45, 0, 180));
		expect(result?.paths[1]).toBe(
			generateDonutSlice(100, 90, 90, 45, 180, 359.9),
		);
	});

	it("centerPoint presente solo se centerElement.value e' definito", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [{ name: "a", value: 100 }],
		};

		const withCenter = generateDonutPaths(serie, {
			...baseCtx,
			centerElement: { value: "42" },
		});
		const withoutCenter = generateDonutPaths(serie, baseCtx);

		expect(withCenter?.centerPoint).toEqual({ x: 100, y: 90 });
		expect(withoutCenter && "centerPoint" in withoutCenter).toBe(false);
	});

	it("una fetta sotto i 31 gradi non genera un dataPoint per la label", () => {
		const serie = {
			name: "d1",
			type: "donut",
			data: [
				{ name: "small", value: 5 },
				{ name: "big", value: 95 },
			],
		};
		const result = generateDonutPaths(serie, baseCtx);

		expect(result?.dataPoints.has("small")).toBe(false);
		expect(result?.dataPoints.has("big")).toBe(true);
	});
});

describe("generateAngleDonutPaths", () => {
	const angleDonutCtx = { ...baseCtx, innerRadius: 15 };

	it("value === maxValue con angle custom raggiunge esattamente quell'angolo", () => {
		const serie = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50, maxValue: 50 }],
		};
		const result = generateAngleDonutPaths(serie, {
			...angleDonutCtx,
			angle: 270,
		});

		// radius=90, ringThickness=15 (innerRadius custom): ring0 ->
		// newRadius=90, newInnerRadius=75.
		expect(result?.paths[0]?.path).toBe(
			generateDonutSlice(100, 90, 90, 75, 0, 270),
		);
	});

	it("un valore oltre il 100% del massimo viene clampato a 359.9 gradi, non genera un arco degenere a 360+", () => {
		const serie = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 150, maxValue: 100 }],
		};
		const result = generateAngleDonutPaths(serie, angleDonutCtx);

		expect(result?.paths[0]?.path).toBe(
			generateDonutSlice(100, 90, 90, 75, 0, 359.9),
		);
	});

	it("shadowPath presente solo con showTrack=true E maxValue definito", () => {
		const serieWithMax = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50, maxValue: 100 }],
		};
		const serieNoMax = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50 }],
		};

		const withTrack = generateAngleDonutPaths(serieWithMax, {
			...angleDonutCtx,
			showTrack: true,
		});
		const withoutTrack = generateAngleDonutPaths(serieWithMax, {
			...angleDonutCtx,
			showTrack: false,
		});
		const trackNoMax = generateAngleDonutPaths(serieNoMax, {
			...angleDonutCtx,
			showTrack: true,
		});

		expect(withTrack?.paths[0]?.shadowPath).not.toBe("");
		expect(withoutTrack?.paths[0]?.shadowPath).toBe("");
		expect(trackNoMax?.paths[0]?.shadowPath).toBe("");
	});

	it("piu' elementi in data generano anelli concentrici, ciascuno con la propria labelElement (K7)", () => {
		const serie = {
			name: "s1",
			type: "angle-donut",
			data: [
				{ name: "kpi1", value: 30, maxValue: 100 },
				{ name: "kpi2", value: 60, maxValue: 100 },
			],
		};
		const result = generateAngleDonutPaths(serie, angleDonutCtx);

		// x costante (vicino al centro, K7): stessa larghezza label per ogni
		// anello. y diverso: ogni anello e' ancorato al proprio raggio medio,
		// non sovrapposto al primo.
		expect(result?.paths[0]?.labelElement).toEqual({
			x: 41,
			y: 0,
			width: 54,
			height: 15,
		});
		expect(result?.paths[1]?.labelElement).toEqual({
			x: 41,
			y: 16.25,
			width: 54,
			height: 15,
		});
	});

	it("centerPoint presente solo se centerElement.value e' definito", () => {
		const serie = {
			name: "ad1",
			type: "angle-donut",
			data: [{ name: "kpi", value: 50, maxValue: 100 }],
		};

		const withCenter = generateAngleDonutPaths(serie, {
			...angleDonutCtx,
			centerElement: { value: "42" },
		});
		const withoutCenter = generateAngleDonutPaths(serie, angleDonutCtx);

		expect(withCenter?.centerPoint).toEqual({ x: 100, y: 90 });
		expect(withoutCenter && "centerPoint" in withoutCenter).toBe(false);
	});
});
