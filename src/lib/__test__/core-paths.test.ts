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
	getGroupBarSlotCount,
	getGroupBarSlotIndex,
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

		expect(result?.paths[0]).toBe("M 5 50 V 63.333333333333336 H 15 V 50 Z");

		expect(result?.paths[1]).toBe("M 35 50 V 10 H 45 V 50 Z");
	});

	it("la label interna sta sopra zeroY per valori positivi e sotto per negativi, non vicino a chartYEnd (K6, regressione)", () => {
		const negSerie = {
			name: "n1",
			type: "bar",
			data: [
				{ date: "a", value: -25 },
				{ date: "b", value: 20 },
			],
		};
		const result = generateNegativeDataPaths(
			negSerie,
			{ ...baseCtx, elements: [negSerie], negative: true, chartXEnd: 60 },
			"bar",
		);

		const zeroY = baseCtx.chartYMiddle;
		const [pointA, pointB] = result?.dataPoints.get("n1") ?? [];

		expect(pointA?.[1]).toBeGreaterThan(zeroY);

		expect(pointB?.[1]).toBeLessThan(zeroY);

		expect(pointA).toEqual([10, 67.5]);
		expect(pointB).toEqual([40, 36.5]);
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

		expect(x1).toBeCloseTo(10);

		expect(x2).toBeCloseTo(22.5);
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

		expect(r2?.paths[0]).toBe("M 5 64 V 10 H 15 V 64 Z");
	});

	it("un gruppo stacked con 2+ serie non fa slittare lo slot del gruppo successivo (regressione K1)", () => {
		const a1 = {
			name: "a1",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "x", value: 10 }],
		};
		const a2 = {
			name: "a2",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "x", value: 20 }],
		};
		const b1 = {
			name: "b1",
			type: "group-bar",
			stackedName: "group-b",
			data: [{ date: "x", value: 15 }],
		};
		const ctx = { ...baseCtx, elements: [a1, a2, b1], chartXEnd: 90 };

		const rA1 = generateStackedGroupDataPaths(a1, ctx);
		const rB1 = generateStackedGroupDataPaths(b1, ctx);

		const a1X = Number(rA1?.paths[0]?.split(" ")[1]);
		const b1X = Number(rB1?.paths[0]?.split(" ")[1]);
		const groupSlotWidth = b1X - a1X;

		expect(groupSlotWidth).toBeCloseTo(12.5, 5);
	});
});

describe("getGroupBarSlotCount", () => {
	it("le serie con lo stesso stackedName condividono un solo slot (K9)", () => {
		const a1 = {
			name: "a1",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "x", value: 10 }],
		};
		const a2 = {
			name: "a2",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "x", value: 20 }],
		};
		const b1 = {
			name: "b1",
			type: "group-bar",
			stackedName: "group-b",
			data: [{ date: "x", value: 15 }],
		};
		const c1 = {
			name: "c1",
			type: "group-bar",
			data: [{ date: "x", value: 5 }],
		};

		expect(getGroupBarSlotCount([a1, a2, b1, c1])).toBe(3);
	});

	it("nessuna serie group-bar => 0 slot", () => {
		const pie = { name: "p1", type: "pie", data: [] };
		expect(getGroupBarSlotCount([pie])).toBe(0);
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

	it("caso negativo: la posizione Y di ogni gridline e' proporzionale e simmetrica attorno a chartYMiddle (D6)", () => {
		const ctx = {
			...baseCtx,
			elements: [barSerie],
			yInterval: 4,
			negative: true,
		};
		const result = generateYAxis(barSerie, ctx);

		expect(result?.valueLabels).toEqual([
			{ value: -40, x: 0, y: 90 },
			{ value: 40, x: 0, y: 10 },
			{ value: 20, x: 0, y: 30 },
			{ value: 0, x: 0, y: 50 },
			{ value: -20, x: 0, y: 70 },
			{ value: 40, x: 0, y: 10 },
		]);
	});

	it("caso negativo: la gridline dell'asse Y coincide con la punta della barra dello stesso valore (D6, regressione)", () => {
		const negSerie = {
			name: "n1",
			type: "bar",
			data: [{ date: "a", value: 40 }],
		};
		const ctx = {
			...baseCtx,
			elements: [negSerie],
			yInterval: 4,
			negative: true,
		};

		const yAxis = generateYAxis(negSerie, ctx);
		const bar = generateNegativeDataPaths(negSerie, ctx, "bar");

		const gridlineY = yAxis?.valueLabels.find((l) => l.value === 40)?.y;

		const barTopY = Number(bar?.paths[0]?.split(" ")[4]);

		expect(gridlineY).toBe(barTopY);
	});

	it("l'alternanza sinistra/destra ignora gli elementi senza asse Y intercalati (K4, regressione)", () => {
		const serieA = {
			name: "serieA",
			type: "line",
			data: [{ date: "x", value: 10 }],
		};
		const thresholdX = { name: "thresholdX", type: "threshold", data: 5 };
		const serieB = {
			name: "serieB",
			type: "line",
			data: [{ date: "x", value: 20 }],
		};

		const ctx = {
			...baseCtx,
			elements: [serieA, thresholdX, serieB],
			yInterval: 4,
		};

		const yAxisA = generateYAxis(serieA, ctx);
		const yAxisB = generateYAxis(serieB, ctx);

		expect(yAxisA?.isOpposite).toBe(false);
		expect(yAxisB?.isOpposite).toBe(true);
	});
});

describe("getGroupBarSlotIndex", () => {
	it("le serie con lo stesso stackedName condividono lo stesso indice di slot (K9/K10)", () => {
		const a1 = {
			name: "a1",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "x", value: 10 }],
		};
		const a2 = {
			name: "a2",
			type: "group-bar",
			stackedName: "group-a",
			data: [{ date: "x", value: 20 }],
		};
		const b1 = {
			name: "b1",
			type: "group-bar",
			data: [{ date: "x", value: 15 }],
		};
		const elements = [a1, a2, b1];

		expect(getGroupBarSlotIndex(elements, a1)).toBe(0);
		expect(getGroupBarSlotIndex(elements, a2)).toBe(0);
		expect(getGroupBarSlotIndex(elements, b1)).toBe(1);
	});

	it("gli elementi non group-bar intercalati non consumano uno slot (regressione K10)", () => {
		const a1 = {
			name: "a1",
			type: "group-bar",
			data: [{ date: "x", value: 10 }],
		};
		const line = { name: "l1", type: "line", data: [{ date: "x", value: 5 }] };
		const b1 = {
			name: "b1",
			type: "group-bar",
			stackedName: "group-b",
			data: [{ date: "x", value: 15 }],
		};

		expect(getGroupBarSlotIndex([a1, line, b1], b1)).toBe(1);
	});
});

describe("generateGroupDataPaths / generateStackedGroupDataPaths: coerenza tra stacked e non-stacked (regressione K10)", () => {
	it("una serie non-stacked dopo un gruppo stacked da 2 serie occupa lo slot successivo, non uno vuoto", () => {
		const a = {
			name: "a",
			type: "group-bar",
			data: [{ date: "x", value: 10 }],
		};
		const b = {
			name: "b",
			type: "group-bar",
			stackedName: "s1",
			data: [{ date: "x", value: 10 }],
		};
		const c = {
			name: "c",
			type: "group-bar",
			stackedName: "s1",
			data: [{ date: "x", value: 10 }],
		};
		const d = {
			name: "d",
			type: "group-bar",
			data: [{ date: "x", value: 10 }],
		};
		const ctx = { ...baseCtx, elements: [a, b, c, d], chartXEnd: 90 };

		const rA = generateGroupDataPaths(a, ctx);
		const rB = generateStackedGroupDataPaths(b, ctx);
		const rD = generateGroupDataPaths(d, ctx);

		const xA = rA?.dataPoints.get("a")?.[0]?.[0] as number;
		const xB = Number(rB?.paths[0]?.split(" ")[1]) + 5;
		const xD = rD?.dataPoints.get("d")?.[0]?.[0] as number;

		expect(xB - xA).toBeCloseTo(xD - xB, 5);
	});

	it("una serie non group-bar (es. line) intercalata non sposta il gruppo stacked (regressione K10)", () => {
		const a = {
			name: "a",
			type: "group-bar",
			data: [{ date: "x", value: 10 }],
		};
		const line = { name: "l", type: "line", data: [{ date: "x", value: 5 }] };
		const b = {
			name: "b",
			type: "group-bar",
			stackedName: "s1",
			data: [{ date: "x", value: 10 }],
		};
		const c = {
			name: "c",
			type: "group-bar",
			stackedName: "s1",
			data: [{ date: "x", value: 10 }],
		};

		const ctxWithLine = {
			...baseCtx,
			elements: [a, line, b, c],
			chartXEnd: 90,
		};
		const ctxWithoutLine = { ...baseCtx, elements: [a, b, c], chartXEnd: 90 };

		const xBWithLine = generateStackedGroupDataPaths(b, ctxWithLine)?.paths[0];
		const xBWithoutLine = generateStackedGroupDataPaths(b, ctxWithoutLine)
			?.paths[0];

		expect(xBWithLine).toBe(xBWithoutLine);
	});
});
