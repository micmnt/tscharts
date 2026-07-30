import { describe, expect, it } from "vitest";
import {
	generateDataPaths,
	generateGroupDataPaths,
	generateHorizontalDataPaths,
	generateNegativeDataPaths,
	generateStackedDataPaths,
	generateStackedGroupDataPaths,
	generateXAxis,
	generateYAxis,
} from "../core";

const barSerie = {
	name: "s1",
	type: "bar",
	data: [
		{ date: "a", value: 10 },
		{ date: "b", value: 40 },
		{ date: "c", value: 20 },
	],
};

const baseCtx = {
	elements: [barSerie],
	chartXStart: 0,
	chartXEnd: 90,
	chartYEnd: 100,
	chartYMiddle: 50,
	height: 400,
	padding: 10,
	flatMax: false,
};

describe("generateDataPaths", () => {
	it("genera un path per barra per ogni punto dato", () => {
		const result = generateDataPaths(barSerie, baseCtx, "bar");
		expect(result?.paths).toEqual([
			"M 5 100 V 77.5 H 15 V 100 Z",
			"M 35 100 V 10 H 45 V 100 Z",
			"M 65 100 V 55 H 75 V 100 Z",
		]);
		expect(result?.dataPoints.get("s1")).toEqual([
			[10, 91.25],
			[40, 57.5],
			[70, 80],
		]);
	});

	it("con trimZeros, un valore 0 in una linea crea un gap (path 'M' invece di 'L')", () => {
		const lineSerie = {
			name: "l1",
			type: "line",
			data: [
				{ date: "a", value: 10 },
				{ date: "b", value: 0 },
				{ date: "c", value: 20 },
			],
		};
		const result = generateDataPaths(
			lineSerie,
			{ ...baseCtx, elements: [lineSerie], trimZeros: true },
			"line",
		);
		// Il punto centrale (valore 0 trattato come null) sparisce dal path:
		// restano due segmenti separati, il secondo riparte con "M" (non "L").
		expect(result?.paths).toEqual(["M 15 55", "M 75 10"]);
	});
});

describe("generateNegativeDataPaths", () => {
	it("posiziona i valori positivi sopra e negativi sotto la linea dello zero (chartYMiddle)", () => {
		const negSerie = {
			name: "n1",
			type: "bar",
			data: [
				{ date: "a", value: -10 },
				{ date: "b", value: 30 },
			],
		};
		const result = generateNegativeDataPaths(
			negSerie,
			{ ...baseCtx, elements: [negSerie], negative: true, chartXEnd: 60 },
			"bar",
		);
		// Punto 0 (-10): la barra scende SOTTO lo zero (V 71.66... > zeroY 50)
		expect(result?.paths[0]).toBe("M 5 50 V 71.66666666666667 H 15 V 50 Z");
		// Punto 1 (30): la barra sale SOPRA lo zero (V -15 < zeroY 50)
		expect(result?.paths[1]).toBe("M 35 50 V -15 H 45 V 50 Z");
	});
});

describe("generateStackedDataPaths", () => {
	it("la seconda serie stacked parte esattamente dove finisce la prima", () => {
		const s1 = {
			name: "st1",
			type: "bar-stacked",
			data: [
				{ date: "a", value: 10 },
				{ date: "b", value: 20 },
			],
		};
		const s2 = {
			name: "st2",
			type: "bar-stacked",
			data: [
				{ date: "a", value: 5 },
				{ date: "b", value: 15 },
			],
		};
		const ctx = { ...baseCtx, elements: [s1, s2], chartXEnd: 60 };

		const r1 = generateStackedDataPaths(s1, ctx);
		const r2 = generateStackedDataPaths(s2, ctx);

		expect(r1?.paths[0]).toBe("M 5 100 V 74.28571428571428 H 15 V 100 Z");
		// s2 (sopra s1) inizia dal bordo superiore di s1 (74.2857...): stesso
		// valore, non e' una coincidenza, prova l'accumulo corretto.
		expect(r2?.paths[0]).toBe(
			"M 5 74.28571428571428 V 61.42857142857142 H 15 V 74.28571428571428 Z",
		);
	});
});

describe("generateGroupDataPaths", () => {
	it("serie diverse dello stesso gruppo ottengono offset orizzontali diversi", () => {
		const g1 = {
			name: "g1",
			type: "group-bar",
			data: [{ date: "a", value: 10 }],
		};
		const g2 = {
			name: "g2",
			type: "group-bar",
			data: [{ date: "a", value: 20 }],
		};
		const ctx = { ...baseCtx, elements: [g1, g2], chartXEnd: 60 };

		const r1 = generateGroupDataPaths(g1, ctx);
		const r2 = generateGroupDataPaths(g2, ctx);

		const x1 = r1?.dataPoints.get("g1")?.[0]?.[0];
		const x2 = r2?.dataPoints.get("g2")?.[0]?.[0];

		expect(x1).toBeCloseTo(7.5);
		expect(x2).toBeCloseTo(35.83333333333333);
		expect(x1).not.toBe(x2);
	});
});

describe("generateStackedGroupDataPaths", () => {
	it("due serie con lo stesso stackedName si impilano come generateStackedDataPaths", () => {
		const sg1 = {
			name: "sg1",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "a", value: 10 }],
		};
		const sg2 = {
			name: "sg2",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "a", value: 15 }],
		};
		const ctx = { ...baseCtx, elements: [sg1, sg2], chartXEnd: 60 };

		const r1 = generateStackedGroupDataPaths(sg1, ctx);
		const r2 = generateStackedGroupDataPaths(sg2, ctx);

		expect(r1?.paths[0]).toBe("M 5 100 V 64 H 15 V 100 Z");
		// sg2 continua da dove finisce sg1 (64), stessa logica di accumulo
		// di generateStackedDataPaths ma applicata dentro lo slot del gruppo.
		expect(r2?.paths[0]).toBe("M 5 64 V 10 H 15 V 64 Z");
	});
});

describe("generateHorizontalDataPaths", () => {
	it("orienta le barre lungo l'asse Y e omette il dataPoint per barre troppo corte", () => {
		const result = generateHorizontalDataPaths(barSerie, baseCtx, "bar");

		expect(result?.paths).toEqual([
			"M 40 5 H 48 V 15 H 40 Z",
			"M 40 35 H 72 V 45 H 40 Z",
			"M 40 65 H 56 V 75 H 40 Z",
		]);
		// Il primo punto (valore 10) e' troppo corto per contenere una label:
		// sentinel [-1, -1], stessa MIN_BAR_HEIGHT_FOR_LABEL vista in B4.
		expect(result?.dataPoints.get("s1")?.[0]).toEqual([-1, -1]);
	});
});

describe("generateXAxis", () => {
	it("usa chartYEnd per i grafici normali e chartYMiddle per quelli negativi", () => {
		expect(generateXAxis(baseCtx).path).toBe("M 0 100 H 90");
		expect(generateXAxis({ ...baseCtx, negative: true }).path).toBe(
			"M 0 50 H 90",
		);
	});
});

describe("generateYAxis", () => {
	it("caso positivo: genera yInterval+1 label da 0 al valore massimo", () => {
		const ctx = { ...baseCtx, elements: [barSerie], yInterval: 4 };
		const result = generateYAxis(barSerie, ctx);

		expect(result?.valueLabels.map((l) => l.value)).toEqual([
			0, 10, 20, 30, 40,
		]);
		expect(result?.isOpposite).toBe(false);
		expect(result?.path).toBe("M 5 0 V 100");
	});

	it("caso negativo: le label vanno da -max a +max attorno allo zero", () => {
		const ctx = {
			...baseCtx,
			elements: [barSerie],
			yInterval: 4,
			negative: true,
		};
		const result = generateYAxis(barSerie, ctx);

		expect(result?.valueLabels.map((l) => l.value)).toEqual([
			-40, 40, 20, 0, -20, 40,
		]);
	});
});
